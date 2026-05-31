'use client';

import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Camera,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { UploadQueueItem } from '@/types';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

const MAX_CONCURRENCY = 5;
const MAX_FILES = 10;

async function uploadFile(file: File): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);
  return fetch('/api/upload', { method: 'POST', body: formData });
}

async function processConcurrent<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  concurrency: number
) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()!;
      await processor(item);
    }
  });
  await Promise.all(workers);
}

export function UploadModal({ open, onClose }: UploadModalProps) {
  const router = useRouter();
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, MAX_FILES - queue.length);
    const newItems: UploadQueueItem[] = fileArray.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      status: 'pending',
      progress: 0,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setQueue((prev) => [...prev, ...newItems]);
  }, [queue.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const updateItem = (id: string, update: Partial<UploadQueueItem>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...update } : item)));
  };

  const processItem = async (item: UploadQueueItem) => {
    updateItem(item.id, { status: 'uploading', progress: 20 });

    try {
      updateItem(item.id, { status: 'processing', progress: 60 });
      const response = await uploadFile(item.file);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      updateItem(item.id, { status: 'done', progress: 100, receipt: data.receipt });
    } catch (err) {
      updateItem(item.id, {
        status: 'failed',
        progress: 0,
        error: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  };

  const startProcessing = async () => {
    const pendingItems = queue.filter((item) => item.status === 'pending' || item.status === 'failed');
    if (pendingItems.length === 0) return;

    setIsProcessing(true);

    await processConcurrent(pendingItems, processItem, MAX_CONCURRENCY);

    setIsProcessing(false);

    toast.success(`Processing complete!`);
    router.refresh();
  };

  const retryItem = async (item: UploadQueueItem) => {
    updateItem(item.id, { status: 'pending', progress: 0, error: undefined });
    await processItem({ ...item, status: 'pending' });
  };

  const removeItem = (id: string) => {
    setQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleClose = () => {
    if (!isProcessing) {
      queue.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setQueue([]);
      onClose();
    }
  };

  const doneCount = queue.filter((i) => i.status === 'done').length;
  const failedCount = queue.filter((i) => i.status === 'failed').length;
  const pendingCount = queue.filter((i) => i.status === 'pending').length;

  const getStatusColor = (status: UploadQueueItem['status']) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'uploading':
      case 'processing': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: UploadQueueItem['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'AI Processing...';
      case 'done': return 'Done';
      case 'failed': return 'Failed';
      default: return 'Pending';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            Add Receipts
          </DialogTitle>
        </DialogHeader>

        {queue.length === 0 ? (
          <div className="space-y-4">
            {/* Drag and drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-7 h-7 text-indigo-600" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                Drop receipts here or click to browse
              </p>
              <p className="text-sm text-gray-500">JPG, PNG, HEIC, PDF — up to 10 files, 20MB each</p>
            </div>

            {/* Camera button (mobile) */}
            <Button
              onClick={() => cameraInputRef.current?.click()}
              variant="outline"
              className="w-full gap-2 h-12 lg:hidden"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Queue summary */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-600 dark:text-gray-400">{queue.length} file{queue.length !== 1 ? 's' : ''}</span>
              {doneCount > 0 && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{doneCount} done</Badge>}
              {failedCount > 0 && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{failedCount} failed</Badge>}
            </div>

            {/* Queue items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  {/* Preview */}
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                    {item.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                      {item.receipt?.merchant && (
                        <span className="text-xs text-gray-500 truncate">{item.receipt.merchant}</span>
                      )}
                    </div>
                    {(item.status === 'uploading' || item.status === 'processing') && (
                      <Progress value={item.progress} className="h-1 mt-1.5" />
                    )}
                    {item.error && (
                      <p className="text-xs text-red-600 mt-0.5 truncate">{item.error}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {item.status === 'done' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {item.status === 'failed' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7"
                          onClick={() => retryItem(item)}
                          disabled={isProcessing}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    {(item.status === 'uploading' || item.status === 'processing') && (
                      <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    )}
                    {item.status === 'pending' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-7 h-7"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add more */}
            {queue.length < MAX_FILES && !isProcessing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
              >
                <Upload className="w-4 h-4" />
                Add more files
              </Button>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800 mt-2">
          <Button variant="ghost" onClick={handleClose} disabled={isProcessing}>
            {doneCount > 0 && !isProcessing ? 'Close' : 'Cancel'}
          </Button>
          <div className="flex gap-2">
            {queue.length > 0 && pendingCount > 0 && (
              <Button
                onClick={startProcessing}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Process {pendingCount} receipt{pendingCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,image/webp,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </DialogContent>
    </Dialog>
  );
}
