"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Loader2, RefreshCcw, UploadCloud } from "lucide-react";
import pLimit from "p-limit";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { MAX_BATCH_SIZE, MAX_CONCURRENT_UPLOADS } from "@/lib/constants";
import type { QueueStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QueueItem {
  id: string;
  file: File;
  status: QueueStatus;
  error?: string;
}

const acceptedTypes = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/heic": [".heic"],
  "application/pdf": [".pdf"],
};

export function ReceiptUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const limit = useMemo(() => pLimit(MAX_CONCURRENT_UPLOADS), []);

  const updateQueue = (id: string, next: Partial<QueueItem>) => {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...next } : item)));
  };

  const uploadOne = async (item: QueueItem) => {
    try {
      updateQueue(item.id, { status: "uploading", error: undefined });
      const formData = new FormData();
      formData.append("file", item.file);
      updateQueue(item.id, { status: "processing" });
      const response = await fetch("/api/receipts/process", { method: "POST", body: formData });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Upload failed.");
      }
      updateQueue(item.id, { status: "done" });
      router.refresh();
      return true;
    } catch (error) {
      updateQueue(item.id, { status: "failed", error: error instanceof Error ? error.message : "Upload failed." });
      return false;
    }
  };

  const processFiles = async (files: File[]) => {
    if (!files.length) return;
    if (files.length > MAX_BATCH_SIZE) {
      toast.error(`You can upload up to ${MAX_BATCH_SIZE} receipts at a time.`);
      return;
    }

    const items = files.map((file) => ({ id: `${file.name}-${crypto.randomUUID()}`, file, status: "idle" as QueueStatus }));
    setQueue((current) => [...items, ...current].slice(0, MAX_BATCH_SIZE));

    const results = await Promise.all(items.map((item) => limit(() => uploadOne(item))));
    const successCount = results.filter(Boolean).length;
    if (successCount > 0) {
      toast.success(`${successCount} receipt${successCount === 1 ? "" : "s"} processed.`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: processFiles,
    maxFiles: MAX_BATCH_SIZE,
    accept: acceptedTypes,
  });

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardHeader>
          <CardTitle className="text-2xl">Capture receipts in seconds</CardTitle>
          <CardDescription>
            Mobile-first upload with camera capture, desktop drag-and-drop, Cloudinary enhancement, and Claude-powered extraction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`rounded-[1.5rem] border border-dashed p-6 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border bg-background/70"}`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-medium">Drag receipts here or browse files</p>
            <p className="mt-2 text-sm text-muted-foreground">Supports JPG, PNG, HEIC, and PDF. Max batch size: 10.</p>
            <Button className="mt-4" type="button">
              <ImagePlus className="h-4 w-4" />
              Choose files
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 md:hidden">
            <Button className="h-14 flex-1 text-base" size="lg" type="button" onClick={() => fileInputRef.current?.click()}>
              <Camera className="h-5 w-5" />
              Open camera
            </Button>
            <input
              accept="image/*,.heic,application/pdf"
              capture="environment"
              className="hidden"
              multiple
              onChange={(event) => processFiles(Array.from(event.target.files || []))}
              ref={fileInputRef}
              type="file"
            />
          </div>
        </CardContent>
      </Card>

      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Batch queue</CardTitle>
            <CardDescription>Uploads run with a max concurrency of {MAX_CONCURRENT_UPLOADS} so one failure never blocks the rest.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.map((item) => (
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 p-4" key={item.id}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.file.name}</p>
                  <p className="text-sm text-muted-foreground">{Math.round(item.file.size / 1024)} KB</p>
                  {item.error ? <p className="mt-1 text-sm text-destructive">{item.error}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={item.status === "failed" ? "bg-destructive/10 text-destructive" : item.status === "done" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-secondary text-secondary-foreground"}>
                    {item.status}
                  </Badge>
                  {(item.status === "uploading" || item.status === "processing") && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {item.status === "failed" && (
                    <Button size="sm" variant="outline" type="button" onClick={() => void uploadOne(item)}>
                      <RefreshCcw className="h-4 w-4" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="fixed inset-x-4 bottom-20 z-20 md:hidden">
        <Button className="h-16 w-full shadow-lg" size="lg" type="button" onClick={() => fileInputRef.current?.click()}>
          <Camera className="h-5 w-5" />
          Add your next receipt
        </Button>
      </div>
    </div>
  );
}
