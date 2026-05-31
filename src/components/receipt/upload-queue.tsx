"use client";

import { useCallback, useMemo, useState } from "react";
import { Camera, CheckCircle2, Loader2, RefreshCw, UploadCloud, XCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MAX_BATCH_UPLOAD, BATCH_CONCURRENCY } from "@/lib/constants";
import { cn } from "@/lib/utils";

type UploadStatus = "uploading" | "processing" | "done" | "failed";

interface QueueItem {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
  receiptId?: string;
}

async function processFile(item: QueueItem) {
  const formData = new FormData();
  formData.append("file", item.file);

  const response = await fetch("/api/receipts/ingest", {
    method: "POST",
    body: formData,
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to process receipt.");
  }

  return body as { id: string };
}

async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number) {
  const output: T[] = [];
  const queue = [...tasks];

  const workers = Array.from({ length: Math.min(limit, tasks.length) }).map(async () => {
    while (queue.length) {
      const task = queue.shift();
      if (!task) {
        return;
      }
      output.push(await task());
    }
  });

  await Promise.all(workers);
  return output;
}

export function UploadQueue({ onComplete }: { onComplete: () => void }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);

  const queueStats = useMemo(() => {
    const done = items.filter((item) => item.status === "done").length;
    const failed = items.filter((item) => item.status === "failed").length;
    return { total: items.length, done, failed };
  }, [items]);

  const setStatus = (id: string, status: UploadStatus, patch?: Partial<QueueItem>) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }
        return { ...item, status, ...patch };
      }),
    );
  };

  const handleBatch = useCallback(
    async (files: File[]) => {
      if (!files.length) {
        return;
      }

      const selectedFiles = files.slice(0, MAX_BATCH_UPLOAD);
      const created = selectedFiles.map((file) => ({
        id: `${file.name}-${crypto.randomUUID()}`,
        file,
        status: "uploading" as const,
      }));

      setItems((current) => [...created, ...current]);
      setRunning(true);

      const tasks = created.map((item) => async () => {
        try {
          setStatus(item.id, "uploading");
          setStatus(item.id, "processing");
          const result = await processFile(item);
          setStatus(item.id, "done", { receiptId: result.id, error: undefined });
        } catch (error) {
          setStatus(item.id, "failed", { error: (error as Error).message });
        }
      });

      await runWithConcurrency(tasks, BATCH_CONCURRENCY);
      setRunning(false);
      onComplete();
    },
    [onComplete],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      await handleBatch(acceptedFiles);
    },
    [handleBatch],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: MAX_BATCH_UPLOAD,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/heic": [".heic"],
      "application/pdf": [".pdf"],
    },
  });

  const retryItem = async (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    setStatus(id, "uploading", { error: undefined });

    try {
      setStatus(id, "processing");
      const result = await processFile(item);
      setStatus(id, "done", { receiptId: result.id });
      onComplete();
    } catch (error) {
      setStatus(id, "failed", { error: (error as Error).message });
    }
  };

  return (
    <Card id="capture" className="scroll-mt-28">
      <CardHeader>
        <CardTitle>Receipt Capture</CardTitle>
        <CardDescription>
          Mobile camera + desktop drag-and-drop. Max {MAX_BATCH_UPLOAD} files, processing {BATCH_CONCURRENCY} concurrently.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Quick mobile capture</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="block w-full rounded-lg border border-zinc-200 p-2 text-sm dark:border-zinc-700"
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? []);
              void handleBatch(selected);
              event.currentTarget.value = "";
            }}
          />
        </label>

        <div
          {...getRootProps()}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition",
            isDragActive
              ? "border-sky-500 bg-sky-50 dark:bg-sky-950/20"
              : "border-zinc-300 hover:border-sky-400 dark:border-zinc-700",
          )}
        >
          <input {...getInputProps()} />
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
            <UploadCloud className="size-6" />
          </div>
          <p className="text-sm font-medium">{isDragActive ? "Drop files to upload" : "Drag and drop receipts here"}</p>
          <p className="mt-1 text-xs text-zinc-500">JPG, PNG, HEIC, PDF</p>
        </div>

        {items.length ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Batch queue</p>
              <p className="text-xs text-zinc-500">
                {queueStats.done}/{queueStats.total} done · {queueStats.failed} failed
              </p>
            </div>
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.file.name}</p>
                  <p className="text-xs capitalize text-zinc-500">{item.status}</p>
                  {item.error ? <p className="text-xs text-red-600">{item.error}</p> : null}
                </div>
                <div className="ml-2 flex items-center gap-2">
                  {item.status === "uploading" || item.status === "processing" ? (
                    <Loader2 className="size-4 animate-spin text-sky-600" />
                  ) : null}
                  {item.status === "done" ? <CheckCircle2 className="size-4 text-emerald-600" /> : null}
                  {item.status === "failed" ? <XCircle className="size-4 text-red-600" /> : null}

                  {item.status === "failed" ? (
                    <Button size="sm" variant="outline" onClick={() => retryItem(item.id)}>
                      <RefreshCw className="size-4" />
                      Retry
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!items.length && !running ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
            <Camera className="mx-auto mb-2 size-5" />
            No receipts yet — tap the camera to add your first one.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
