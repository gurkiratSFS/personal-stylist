"use client";

import { cn } from "@/lib/utils";

export function OptionChips({
  name,
  options,
  selected,
  onChange,
  multiple = true,
  swatches,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  swatches?: Record<string, string>;
}) {
  function toggle(value: string) {
    if (multiple) {
      onChange(
        selected.includes(value)
          ? selected.filter((entry) => entry !== value)
          : [...selected, value],
      );
      return;
    }
    onChange(selected.includes(value) ? [] : [value]);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={selected.join(",")} />
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-accent/50",
              )}
            >
              {swatches?.[option.value] ? (
                <span
                  className="size-3 rounded-full border border-black/10"
                  style={{ backgroundColor: swatches[option.value] }}
                  aria-hidden
                />
              ) : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
