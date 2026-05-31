"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, Loader2, RefreshCcw, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UploadQueueStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type QueueItem = {
  id: string;
  file: File;
  status: UploadQueueStatus;
  error?: string;
  receiptId?: string;
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "application/pdf"];
const MAX_BATCH_SIZE = 10;
const MAX_CONCURRENCY = 5;

function isSupportedFile(file: File) {
  if (ACCEPTED_TYPES.includes(file.type)) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".heic", ".pdf"].some((extension) => lowerName.endsWith(extension));
}

function createLimiter(limit: number) {
  let activeCount = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    activeCount -= 1;
    const run = queue.shift();
    if (run) {
      run();
    }
  };

  return async function limitTask<T>(task: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        activeCount += 1;
        try {
          resolve(await task());
        } catch (error) {
          reject(error);
        } finally {
          next();
        }
      };

      if (activeCount < limit) {
        void run();
      } else {
        queue.push(() => {
          void run();
        });
      }
    });
  };
}

function QueueList({
  queue,
  onRetry,
}: {
  queue: QueueItem[];
  onRetry: (item: QueueItem) => void;
}) {
  if (!queue.length) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Batch queue</CardTitle>
        <CardDescription>Each receipt processes independently, so one failure never blocks the rest.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {queue.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-3xl border border-border bg-background px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.status === "done"
                  ? "Done"
                  : item.status === "failed"
                    ? item.error || "Failed"
                    : item.status === "processing"
                      ? "Processing with Claude"
                      : "Uploading to Cloudinary"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {(item.status === "uploading" || item.status === "processing") && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {item.status === "failed" ? (
                <Button size="sm" variant="outline" onClick={() => onRetry(item)}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReceiptUploader({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const queueSummary = useMemo(
    () => ({
      processing: queue.filter((item) => item.status === "processing" || item.status === "uploading").length,
      failed: queue.filter((item) => item.status === "failed").length,
    }),
    [queue],
  );

  const updateItem = (id: string, partial: Partial<QueueItem>) => {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...partial } : item)));
  };

  const processOne = async (item: QueueItem) => {
    updateItem(item.id, { status: "uploading", error: undefined });
    await new Promise((resolve) => setTimeout(resolve, 150));
    updateItem(item.id, { status: "processing" });

    const formData = new FormData();
    formData.append("file", item.file);

    const response = await fetch("/api/receipts/process", {
      method: "POST",
      body: formData,
    });

    const payload = (await response.json()) as { error?: string; receiptId?: string };

    if (!response.ok) {
      throw new Error(payload.error || "Receipt processing failed.");
    }

    updateItem(item.id, { status: "done", receiptId: payload.receiptId });
  };

  const startBatch = async (files: File[]) => {
    if (!files.length) {
      return;
    }

    const invalidFile = files.find((file) => !isSupportedFile(file));
    if (invalidFile) {
      toast.error(`${invalidFile.name} is not supported. Use JPG, PNG, HEIC, or PDF.`);
      return;
    }

    const limitedFiles = files.slice(0, MAX_BATCH_SIZE);
    if (files.length > MAX_BATCH_SIZE) {
      toast.warning(`Only the first ${MAX_BATCH_SIZE} receipts were added to the queue.`);
    }

    const items = limitedFiles.map<QueueItem>((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "uploading",
    }));

    setQueue((current) => [...items, ...current]);

    const limitTask = createLimiter(MAX_CONCURRENCY);

    await Promise.all(
      items.map((item) =>
        limitTask(async () => {
          try {
            await processOne(item);
          } catch (error) {
            updateItem(item.id, {
              status: "failed",
              error: error instanceof Error ? error.message : "Receipt processing failed.",
            });
          }
        }),
      ),
    );

    router.refresh();
  };

  const onFilesSelected = async (fileList: FileList | null) => {
    if (!fileList) {
      return;
    }

    await startBatch(Array.from(fileList));
  };

  const onRetry = async (item: QueueItem) => {
    try {
      await processOne(item);
      router.refresh();
    } catch (error) {
      updateItem(item.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Retry failed.",
      });
    }
  };

  const queuePanel = <QueueList queue={queue} onRetry={onRetry} />;

  if (!embedded) {
    return (
      <>
        {queue.length ? <div className="fixed bottom-28 right-4 z-40 w-[min(92vw,420px)]">{queuePanel}</div> : null}

        <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-4 sm:w-auto sm:translate-x-0">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.heic,application/pdf"
              multiple
              className="hidden"
              onChange={(event) => void onFilesSelected(event.target.files)}
            />
            <input
              ref={captureInputRef}
              type="file"
              accept="image/*,.heic,application/pdf"
              capture="environment"
              multiple
              className="hidden"
              onChange={(event) => void onFilesSelected(event.target.files)}
            />
            <Button
              className="h-14 w-full justify-center rounded-full px-6 text-base shadow-soft sm:hidden"
              size="lg"
              onClick={() => captureInputRef.current?.click()}
            >
              <Camera className="mr-2 h-5 w-5" />
              Scan receipt
            </Button>
            <Button
              className="hidden h-12 rounded-full px-5 shadow-soft sm:inline-flex"
              onClick={() => inputRef.current?.click()}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload receipts
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,application/pdf"
        multiple
        className="hidden"
        onChange={(event) => void onFilesSelected(event.target.files)}
      />
      <Card
        className={cn(
          "border-dashed transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void startBatch(Array.from(event.dataTransfer.files));
        }}
      >
        <CardHeader>
          <CardTitle>Capture receipts</CardTitle>
          <CardDescription>
            Drop up to 10 files here, or browse from your device. Images are enhanced in Cloudinary before AI extraction.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <UploadCloud className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-medium">Drag and drop JPG, PNG, HEIC, or PDF receipts</p>
            <p className="text-sm text-muted-foreground">
              Max batch size {MAX_BATCH_SIZE}, processed with up to {MAX_CONCURRENCY} concurrent workers.
            </p>
          </div>
          <Button size="lg" onClick={() => inputRef.current?.click()}>
            Choose files
          </Button>
        </CardContent>
      </Card>

      {queuePanel}
      {(queueSummary.processing > 0 || queueSummary.failed > 0) && (
        <p className="text-sm text-muted-foreground">
          {queueSummary.processing > 0 ? `${queueSummary.processing} still processing. ` : ""}
          {queueSummary.failed > 0 ? `${queueSummary.failed} failed and can be retried.` : ""}
        </p>
      )}
    </div>
  );
}
