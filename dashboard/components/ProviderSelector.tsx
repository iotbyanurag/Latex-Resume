'use client';

import { PROVIDER_OPTIONS, type Role } from '../lib/config';

interface ProviderSelectorProps {
  role: Role;
  value: string;
  onChange: (role: Role, provider: string) => void;
  disabled?: boolean;
}

export function ProviderSelector({ role, value, onChange, disabled }: ProviderSelectorProps) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-900 capitalize">{role}</p>
        <p className="text-xs text-slate-500">Select provider</p>
      </div>
      <select
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(role, event.target.value)}
      >
        {PROVIDER_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}