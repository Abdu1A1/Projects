import { Uploader } from '@/components/upload/uploader';

export const metadata = { title: 'Upload · ReceiptAI' };

export default function UploadPage() {
  return (
    <div className="container py-6 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Add receipts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Snap a photo, drag and drop, or pick up to 10 files at once. JPG, PNG, HEIC, or PDF.
        </p>
      </header>
      <Uploader />
    </div>
  );
}
