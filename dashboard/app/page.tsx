'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';
import useSWR from 'swr';
import { createRun, listRuns } from '../lib/api';
import { PROVIDER_OPTIONS, ROLES, type Role } from '../lib/config';
import type { CreateRunRequest, RunSummary } from '../lib/types';
import { ProviderSelector } from '../components/ProviderSelector';
import { JDEditor } from '../components/JDEditor';
import { DryRunToggle } from '../components/DryRunToggle';

const fetcher = async () => listRuns();

export default function HomePage() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const initialProviders = useMemo(() => {
    const defaults: Record<Role, string> = {
      reviewer: 'groq',
      swot: 'claude',
      refiner: 'gemini',
      judge: 'claude',
      finalizer: 'groq'
    };
    return defaults;
  }, []);

  const [providers, setProviders] = useState<Record<Role, string>>(initialProviders);

  const { data: runs, mutate } = useSWR<RunSummary[]>('runs', fetcher, {
    refreshInterval: 5000
  });

  useEffect(() => {
    setProviders(initialProviders);
  }, [initialProviders]);

  const handleProviderChange = (role: Role, provider: string) => {
    setProviders((prev) => ({ ...prev, [role]: provider }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }
    setError(null);

    const payload: CreateRunRequest = {
      jobDescription,
      dryRun,
      providers
    };

    startTransition(() => {
      createRun(payload)
        .then((response) => {
          mutate();
          router.push(`/runs/${response.runId}`);
        })
        .catch((reason) => {
          console.error(reason);
          setError(reason instanceof Error ? reason.message : 'Failed to create run.');
        });
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-slate-900">AI Resume Orchestrator</h1>
        <p className="text-sm text-slate-600">
          Paste the job description, pick providers per role, and run the multi-agent pipeline. Dry Runs collect proposed diffs
          without touching LaTeX files or compiling.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <section className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <JDEditor value={jobDescription} onChange={setJobDescription} disabled={pending} />
          </div>
          <div className="grid gap-4">
            <DryRunToggle value={dryRun} onChange={setDryRun} disabled={pending} />
            <p className="text-xs text-slate-500">
              Provider selections are persisted with the run. All secrets are read from environment variables inside the orchestrator
              service. Keys never leave your machine.
            </p>
          </div>
          <div className="grid gap-3">
            {ROLES.map((role) => (
              <ProviderSelector
                key={role}
                role={role}
                value={providers[role]}
                onChange={handleProviderChange}
                disabled={pending}
              />
            ))}
          </div>
        </section>

        {error ? <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={pending}
          >
            {pending ? 'Starting…' : 'Run Pipeline'}
          </button>
        </div>
      </form>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Recent Runs</h2>
        {runs && runs.length > 0 ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {runs.map((run) => (
              <li key={run.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Run {run.id}</p>
                    <p className="text-xs text-slate-500">{new Date(run.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="text-xs font-medium uppercase text-brand">{run.status}</span>
                </div>
                <p className="mt-2 max-h-24 overflow-hidden text-xs text-slate-600">{run.config.jobDescription}</p>
                <button
                  type="button"
                  onClick={() => router.push(`/runs/${run.id}`)}
                  className="mt-3 text-sm font-medium text-brand underline"
                >
                  View details
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            No runs yet. Start by pasting a job description and running the pipeline.
          </p>
        )}
      </section>
    </main>
  );
}
