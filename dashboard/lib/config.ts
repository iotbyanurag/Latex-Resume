export const ORCHESTRATOR_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';

export const PROVIDER_OPTIONS = [
  { id: 'groq', label: 'Groq' },
  { id: 'claude', label: 'Anthropic Claude' },
  { id: 'gemini', label: 'Google Gemini' }
] as const;

export const ROLES = [
  'reviewer',
  'swot',
  'refiner',
  'judge',
  'finalizer'
] as const;

export type Role = (typeof ROLES)[number];