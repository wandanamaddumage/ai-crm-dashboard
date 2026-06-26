import { cn } from "../../lib/utils";

/**
 * Segmented pill tabs (matches the "Monthly / Annually" toggle in the reference).
 * Controlled: pass `value`, `onChange`, and an array of {value,label} tabs.
 */
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface-muted p-1",
        className
      )}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              active
                ? "bg-brand-600 text-white shadow-sm"
                : "text-ink-soft hover:text-ink"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
