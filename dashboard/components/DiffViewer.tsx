'use client';

interface DiffViewerProps {
  diff?: string;
  title?: string;
}

export function DiffViewer({ diff, title = 'Proposed Diffs' }: DiffViewerProps) {
  if (!diff) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
        No diffs to display.
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">{title}</p>
      </div>
      <pre className="max-h-80 overflow-auto rounded bg-slate-950/95 p-3 text-xs leading-relaxed text-slate-100">
        {diff}
      </pre>
    </div>
  );
}