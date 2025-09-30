'use client';

import { useMemo, useState } from 'react';
import type { Role } from '../lib/config';
import type { RoleArtifact } from '../lib/types';

interface RoleOutputViewerProps {
  artifact?: RoleArtifact;
}

function statusColor(status?: RoleArtifact['status']) {
  switch (status) {
    case 'succeeded':
      return 'text-emerald-600';
    case 'failed':
      return 'text-rose-600';
    case 'running':
      return 'text-amber-600';
    default:
      return 'text-slate-500';
  }
}

export function RoleOutputViewer({ artifact }: RoleOutputViewerProps) {
  const [expanded, setExpanded] = useState(false);

  const pretty = useMemo(() => {
    if (!artifact?.output) return '';
    try {
      return JSON.stringify(artifact.output, null, 2);
    } catch (error) {
      console.error('Failed to stringify artifact output', error);
      return String(artifact.output);
    }
  }, [artifact]);

  if (!artifact) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
        Awaiting role output.
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium capitalize">{artifact.role}</p>
          <p className={`text-xs ${statusColor(artifact.status)}`}>{artifact.status}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {artifact.storedPath ? <span>Saved: {artifact.storedPath}</span> : null}
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Hide JSON' : 'View JSON'}
          </button>
        </div>
      </div>
      {artifact.error ? (
        <p className="rounded bg-rose-50 p-2 text-xs text-rose-600">{artifact.error}</p>
      ) : null}
      {expanded && pretty ? (
        <pre className="max-h-64 overflow-auto rounded bg-slate-950/90 p-3 text-xs text-lime-200">
          {pretty}
        </pre>
      ) : null}
    </div>
  );
}