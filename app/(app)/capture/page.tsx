import { UploadQueue } from "@/components/capture/upload-queue";

export const dynamic = "force-dynamic";

export default function CapturePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Receipt Capture</h1>
      <p className="text-sm text-muted-foreground">
        Upload from desktop drag-and-drop or use your phone camera.
      </p>
      <UploadQueue />
    </div>
  );
}
