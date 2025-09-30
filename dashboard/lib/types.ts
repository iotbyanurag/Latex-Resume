import type { Role } from './config';

export type RunStatus = 'pending' | 'running' | 'needs_review' | 'failed' | 'completed';

export interface RunConfig {
  jobDescription: string;
  dryRun: boolean;
  providers: Record<Role, string>;
}

export interface RoleArtifact<TOutput = unknown> {
  role: Role;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  output?: TOutput;
  error?: string;
  storedPath?: string;
}

export interface RunSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: RunStatus;
  config: RunConfig;
  artifacts: RoleArtifact[];
  pdfPath?: string | null;\n  logPath?: string | null;\n  diffSummary?: string | null;
}

export interface CreateRunRequest {
  jobDescription: string;
  dryRun: boolean;
  providers: Record<Role, string>;
}

export interface CreateRunResponse {
  runId: string;
}