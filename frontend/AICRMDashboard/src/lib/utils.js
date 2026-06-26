import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and de-duplicate conflicting Tailwind classes.
 * The canonical shadcn/ui helper.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Return the uppercase initials for a name (e.g. "Sujon Ahmed" -> "SA"). */
export function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}
