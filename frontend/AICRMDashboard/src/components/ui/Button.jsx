import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

/* Button variants — the workhorse of the UI. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        primary:
          "brand-gradient brand-gradient-hover text-white shadow-sm",
        secondary:
          "bg-surface-muted text-ink hover:bg-brand-50 border border-line",
        outline:
          "border border-line bg-surface text-ink hover:bg-surface-muted",
        ghost: "text-ink-soft hover:bg-surface-muted hover:text-ink",
        danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-10 px-5",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export { buttonVariants };
