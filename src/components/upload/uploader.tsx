'use client';

import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import {
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ACCEPTED_FILE_TYPES, MAX_BATCH, MAX_CONCURRENCY } from '@/lib/constants';
import { cn, formatCurrency } from '@/lib/utils';

type Status = 'queued' | 'uploading' | 'processing' | 'done' | 'failed';

interface QueueItem {
  id: string;
  file: File;
  status: Status;
  preview?: string;
  error?: string;
  result?: {
    id: string;
    merchant: string | null;
    total: number | null;
    currency: string | null;
  };
}

export function Uploader() {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const activeRef = useRef(0);

  const addFiles = useCallback((files: File[]) => {
    setQueue((prev) => {
      const remaining = MAX_BATCH - prev.length;
      if (remaining <= 0) {
        toast.error(`You can only queue ${MAX_BATCH} receipts at a time.`);
        return prev;
      }
      const accepted = files.slice(0, remaining);
      const items: QueueItem[] = accepted.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        status: 'queued',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      }));
      const next = [...prev, ...items];
      queueMicrotask(() => processQueue());
      return next;
    });
  }, []);

  const onDrop = useCallback(
    (accepted: File[]) => {
      addFiles(accepted);
    },
    [addFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: 25 * 1024 * 1024,
  });

  async function processItem(item: QueueItem) {
    setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: 'uploading' } : x)));
    try {
      const form = new FormData();
      form.append('file', item.file);
      setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: 'processing' } : x)));
      const res = await fetch('/api/receipts/process', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || (data?.ok === false && !data?.receipt)) {
        throw new Error(data?.detail || data?.error || 'Processing failed');
      }
      setQueue((q) =>
        q.map((x) =>
          x.id === item.id
            ? {
                ...x,
                status: 'done',
                result: {
                  id: data.receipt.id,
                  merchant: data.receipt.merchant,
                  total: data.receipt.total,
                  currency: data.receipt.currency,
                },
              }
            : x,
        ),
      );
    } catch (err: any) {
      setQueue((q) =>
        q.map((x) =>
          x.id === item.id ? { ...x, status: 'failed', error: err?.message ?? 'Failed' } : x,
        ),
      );
    } finally {
      activeRef.current = Math.max(0, activeRef.current - 1);
      processQueue();
    }
  }

  function processQueue() {
    setQueue((q) => {
      const inflight = activeRef.current;
      const slots = Math.max(0, MAX_CONCURRENCY - inflight);
      const next = [...q];
      let started = 0;
      for (const item of next) {
        if (started >= slots) break;
        if (item.status === 'queued') {
          item.status = 'uploading';
          activeRef.current += 1;
          started += 1;
          processItem(item);
        }
      }
      return next;
    });
  }

  function retry(id: string) {
    setQueue((q) => q.map((x) => (x.id === id ? { ...x, status: 'queued', error: undefined } : x)));
    queueMicrotask(() => processQueue());
  }

  function remove(id: string) {
    setQueue((q) => q.filter((x) => x.id !== id));
  }

  const doneCount = queue.filter((q) => q.status === 'done').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div
          {...getRootProps()}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card p-10 text-center transition cursor-pointer',
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60',
          )}
        >
          <input {...getInputProps()} />
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Upload className="h-6 w-6" />
          </div>
          <p className="mt-4 font-semibold">
            {isDragActive ? 'Drop the receipts here' : 'Drag and drop receipts'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Or click to browse. Up to {MAX_BATCH} at once.
          </p>
        </div>
        <div className="flex md:flex-col gap-3">
          <Button
            type="button"
            size="lg"
            className="md:h-full md:w-40"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="mr-2 h-5 w-5" />
            Camera
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length) addFiles(files);
              e.currentTarget.value = '';
            }}
          />
        </div>
      </div>

      {queue.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b p-4">
              <div className="font-semibold">
                Batch queue · {doneCount}/{queue.length} done
              </div>
              {doneCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQueue([]);
                    router.refresh();
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            <ul className="divide-y">
              {queue.map((item) => (
                <li key={item.id} className="flex items-center gap-4 p-3 sm:p-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-muted grid place-items-center">
                    {item.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.preview}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {item.result?.merchant || item.file.name}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {item.result?.total !== undefined &&
                        item.result?.total !== null &&
                        formatCurrency(item.result.total, item.result.currency || 'CAD')}
                      {item.status === 'failed' && (
                        <span className="text-destructive">{item.error}</span>
                      )}
                    </div>
                  </div>
                  <StatusPill status={item.status} />
                  {item.status === 'failed' && (
                    <Button size="sm" variant="outline" onClick={() => retry(item.id)}>
                      <RotateCcw className="mr-1 h-3 w-3" /> Retry
                    </Button>
                  )}
                  {item.status === 'done' && item.result?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/library/${item.result!.id}`)}
                    >
                      Open
                    </Button>
                  )}
                  <button
                    onClick={() => remove(item.id)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  if (status === 'done') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-transparent">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Done
      </Badge>
    );
  }
  if (status === 'failed') {
    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" /> Failed
      </Badge>
    );
  }
  if (status === 'processing') {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-transparent">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing
      </Badge>
    );
  }
  if (status === 'uploading') {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-transparent">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Uploading
      </Badge>
    );
  }
  return <Badge variant="secondary">Queued</Badge>;
}
