import { format, formatDistanceToNow, isValid } from "date-fns";

/** Format a number as compact USD currency, e.g. 78989 -> "$78,989". */
export function currency(value = 0, { compact = false } = {}) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(n);
}

/** Short, human date: "16 Jun 2025". */
export function shortDate(value) {
  const d = new Date(value);
  return isValid(d) ? format(d, "dd MMM yyyy") : "—";
}

/** "10:30 PM" time string. */
export function timeOf(value) {
  const d = new Date(value);
  return isValid(d) ? format(d, "hh:mm a") : "";
}

/** Relative time: "3 days ago". */
export function relative(value) {
  const d = new Date(value);
  return isValid(d) ? `${formatDistanceToNow(d)} ago` : "";
}

/** YYYY-MM-DD value for <input type="date"> binding. */
export function dateInputValue(value) {
  const d = new Date(value);
  return isValid(d) ? format(d, "yyyy-MM-dd") : "";
}
