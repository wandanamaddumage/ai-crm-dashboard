import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "../ui";
import { cn } from "../../lib/utils";

/**
 * KPI stat card with icon, value and optional trend chip — mirrors the
 * "Weekly Revenue +12.8%" card style in the reference UI.
 */
export function StatCard({ label, value, icon: Icon, trend, accent = false }) {
  const positive = trend == null || trend >= 0;
  return (
    <Card
      className={cn(
        "p-5 transition hover:shadow-[var(--shadow-pop)]",
        accent && "brand-gradient text-white"
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            accent ? "bg-white/15 text-white" : "bg-brand-50 text-brand-600"
          )}
        >
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        {trend != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-semibold",
              accent
                ? "bg-white/15 text-white"
                : positive
                ? "bg-brand-50 text-brand-700"
                : "bg-rose-50 text-rose-600"
            )}
          >
            {positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-4 text-2xl font-bold tracking-tight",
          accent ? "text-white" : "text-ink"
        )}
      >
        {value}
      </p>
      <p className={cn("mt-1 text-sm", accent ? "text-white/70" : "text-ink-soft")}>
        {label}
      </p>
    </Card>
  );
}
