import { cn } from "../../lib/utils";

/** Small status pill. Pass `className` for color, or use a preset via `tone`. */
export function Badge({ className, dot, children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        "bg-surface-muted text-ink-soft",
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
      {children}
    </span>
  );
}
