import { cn } from "../../lib/utils";

/**
 * Circular icon button used throughout the reference UI — the small round
 * "↗" action in card headers, and the search / bell buttons in the top nav.
 */
export function IconButton({ className, variant = "outline", children, ...props }) {
  const variants = {
    outline:
      "border border-line bg-surface text-ink-soft hover:text-ink hover:bg-surface-muted",
    ghost: "text-ink-soft hover:text-ink hover:bg-surface-muted",
    solid: "bg-brand-600 text-white hover:bg-brand-700",
    muted: "bg-surface-muted text-ink-soft hover:text-ink hover:bg-line/60",
  };
  return (
    <button
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
