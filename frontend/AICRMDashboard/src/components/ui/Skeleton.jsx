import { cn } from "../../lib/utils";

export function Skeleton({ className }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-surface-muted", className)}
    />
  );
}

/** Centered spinner for full-section loading states. */
export function Spinner({ className }) {
  return (
    <div className={cn("flex items-center justify-center p-10", className)}>
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    </div>
  );
}
