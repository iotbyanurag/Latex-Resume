import { ORCHESTRATOR_URL } from './config';
import type { CreateRunRequest, CreateRunResponse, RunSummary } from './types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as T;
}

export async function createRun(data: CreateRunRequest): Promise<CreateRunResponse> {
  const res = await fetch(`${ORCHESTRATOR_URL}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse<CreateRunResponse>(res);
}

export async function fetchRun(runId: string): Promise<RunSummary> {
  const res = await fetch(`${ORCHESTRATOR_URL}/runs/${runId}`, {
    next: { revalidate: 5 }
  });
  return handleResponse<RunSummary>(res);
}

export async function listRuns(): Promise<RunSummary[]> {
  const res = await fetch(`${ORCHESTRATOR_URL}/runs`, {
    next: { revalidate: 10 }
  });
  return handleResponse<RunSummary[]>(res);
}