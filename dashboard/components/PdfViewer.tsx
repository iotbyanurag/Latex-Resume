'use client';

interface PdfViewerProps {
  src?: string | null;
}

export function PdfViewer({ src }: PdfViewerProps) {
  if (!src) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
        PDF will appear here after a successful build.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <iframe title="Resume Preview" src={src} className="aspect-[1/1.3] w-full rounded-lg" />
    </div>
  );
}