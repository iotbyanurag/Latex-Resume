'use client';

interface DryRunToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function DryRunToggle({ value, onChange, disabled }: DryRunToggleProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="flex items-center gap-2 font-medium text-slate-900">
        Dry Run
        <input
          type="checkbox"
          className="h-4 w-4 rounded border border-slate-300 text-brand focus:ring-brand"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
      </span>
      <span className="text-xs text-slate-500">Propose diffs without writing files or compiling.</span>
    </label>
  );
}
