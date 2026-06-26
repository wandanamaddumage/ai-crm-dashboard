import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";

/* Card primitives — the building block of the entire dashboard. */

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "bg-surface rounded-3xl border border-line shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 p-6 pb-0", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return (
    <h3 className={cn("text-base font-semibold text-ink", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p className={cn("text-sm text-ink-soft mt-0.5", className)} {...props} />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("p-6", className)} {...props} />;
}

/**
 * Reference-style card heading: optional leading icon, title + subtitle, and a
 * trailing circular action (↗ link, a custom node, or a toggle). Matches the
 * card headers throughout the inspiration dashboard.
 */
export function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  to,
  action,
  className,
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted text-ink-soft">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {action ??
        (to ? (
          <Link
            to={to}
            aria-label="Open"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition hover:bg-surface-muted hover:text-ink active:scale-95"
          >
            <ArrowUpRight className="h-[18px] w-[18px]" />
          </Link>
        ) : null)}
    </div>
  );
}
