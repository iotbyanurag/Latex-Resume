'use client';

import { useCallback } from 'react';

interface JDEditorProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export function JDEditor({ value, onChange, disabled }: JDEditorProps) {
  const handleFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      onChange(text);
    },
    [onChange]
  );

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-900">Job Description</label>
        <input
          type="file"
          accept=".txt,.md,.pdf"
          disabled={disabled}
          onChange={handleFile}
          className="text-xs text-slate-500"
        />
      </div>
      <textarea
        className="min-h-[200px] w-full rounded-lg border border-slate-300 bg-white p-3 text-sm shadow-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder="Paste the job description here or upload a file."
      />
    </div>
  );
}