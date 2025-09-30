'use client';

import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetchRun } from '../../../lib/api';
import { DiffViewer } from '../../../components/DiffViewer';
import { PdfViewer } from '../../../components/PdfViewer';
import { RoleOutputViewer } from '../../../components/RoleOutputViewer';
import type { RunSummary } from '../../../lib/types';

const fetcher = async (id: string) => fetchRun(id);

export default function RunDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const runId = params?.id;

  const { data: run, mutate } = useSWR<RunSummary>(runId ? ['run', runId] : null, ([, id]) => fetcher(id), {
    refreshInterval: 5000
  });

  if (!run) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
        <p className="text-sm text-slate-500">Loading run...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Run {run.id}</h1>
          <p className="text-sm text-slate-500">
            Status: <span className="font-semibold text-brand">{run.status}</span>
          </p>
          <p className="text-xs text-slate-400">
            Created {new Date(run.createdAt).toLocaleString()} - Updated {new Date(run.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            onClick={() => mutate()}
          >
            Refresh
          </button>
          <button
            type="button"
            className="rounded bg-slate-200 px-3 py-2 text-sm"
            onClick={() => router.push('/')}
          >
            Back
          </button>
        </div>
      </div>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Job Description</h2>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-slate-100 p-4 text-sm">
          {run.config.jobDescription}
        </pre>
        <div className="grid gap-2 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Provider map</p>
          {Object.entries(run.config.providers).map(([role, provider]) => (
            <div key={role} className="flex justify-between rounded border border-slate-200 bg-white p-2 text-xs uppercase">
              <span className="font-semibold text-slate-700">{role}</span>
              <span className="text-slate-500">{provider}</span>
            </div>
          ))}
          <p className="text-xs text-slate-500">Dry run: {run.config.dryRun ? 'Yes' : 'No'}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <DiffViewer diff={run.diffSummary || undefined} />
        <PdfViewer src={run.pdfPath || undefined} />
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Role Outputs</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {run.artifacts.map((artifact) => (
            <RoleOutputViewer key={artifact.role} artifact={artifact} />
          ))}
        </div>
      </section>

      {run.logPath ? (
        <section className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Build Log</h2>
          <p className="text-xs text-slate-600">
            Logs saved to <code className="font-mono text-xs text-slate-800">{run.logPath}</code>
          </p>
        </section>
      ) : null}
    </main>
  );
}
