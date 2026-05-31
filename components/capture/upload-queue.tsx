"use client";

import { useMemo, useState } from "react";
import pLimit from "p-limit";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Camera, RefreshCw, UploadCloud } from "lucide-react";
import {
  ACCEPTED_UPLOAD_TYPES,
  MAX_BATCH_SIZE,
  MAX_CONCURRENT_PROCESSING,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QueueStatus = "idle" | "uploading" | "processing" | "done" | "failed";

type QueueItem = {
  id: string;
  file: File;
  status: QueueStatus;
  message?: string;
  receiptId?: string;
};

const statusMeta: Record<QueueStatus, { label: string; className: string }> = {
  idle: {
    label: "Ready",
    className: "bg-muted text-muted-foreground",
  },
  uploading: {
    label: "Uploading",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  processing: {
    label: "Processing",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  },
  done: {
    label: "Done",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
};

function getAcceptedTypes() {
  return ACCEPTED_UPLOAD_TYPES.reduce<Record<string, string[]>>((acc, type) => {
    acc[type] = [];
    return acc;
  }, {});
}

export function UploadQueue() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const acceptedMap = useMemo(() => getAcceptedTypes(), []);

  const onDrop = (files: File[]) => {
    const selected = files.slice(0, MAX_BATCH_SIZE);

    setQueue(
      selected.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "idle",
      })),
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: MAX_BATCH_SIZE,
    accept: acceptedMap,
  });

  const updateItem = (id: string, patch: Partial<QueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const processItem = async (item: QueueItem) => {
    try {
      updateItem(item.id, { status: "uploading", message: undefined });

      const formData = new FormData();
      formData.append("file", item.file);

      const response = await fetch("/api/receipts/process", {
        method: "POST",
        body: formData,
      });

      updateItem(item.id, { status: "processing" });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to process receipt");
      }

      updateItem(item.id, { status: "done", receiptId: payload.receiptId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      updateItem(item.id, { status: "failed", message });
    }
  };

  const processQueue = async () => {
    if (queue.length === 0) return;

    setIsRunning(true);
    const limit = pLimit(MAX_CONCURRENT_PROCESSING);

    await Promise.all(queue.map((item) => limit(() => processItem(item))));

    setIsRunning(false);
    router.refresh();
  };

  const retryItem = async (id: string) => {
    const item = queue.find((entry) => entry.id === id);
    if (!item) return;
    await processItem(item);
  };

  const completedCount = queue.filter((item) => item.status === "done").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Capture Receipts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              "rounded-xl border-2 border-dashed p-8 text-center transition",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:border-primary/60",
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">Drag and drop up to 10 receipts</p>
            <p className="text-sm text-muted-foreground">
              Supported: JPG, PNG, HEIC, PDF
            </p>
          </div>

          <label className="block">
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []).slice(0, MAX_BATCH_SIZE);
                if (files.length > 0) onDrop(files);
              }}
            />
            <Button className="mx-auto flex h-14 w-full max-w-md gap-2 text-base">
              <Camera className="size-5" />
              Camera / File Picker
            </Button>
          </label>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {completedCount}/{queue.length} processed
            </p>
            <Button onClick={processQueue} disabled={queue.length === 0 || isRunning}>
              {isRunning ? "Processing..." : "Process Batch"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Batch Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{item.file.name}</p>
                  {item.message && (
                    <p className="text-sm text-red-600 dark:text-red-300">{item.message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusMeta[item.status].className}>
                    {statusMeta[item.status].label}
                  </Badge>
                  {item.status === "failed" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => retryItem(item.id)}
                    >
                      <RefreshCw className="mr-2 size-4" /> Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
