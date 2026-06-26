import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

/**
 * Minimal click-to-open dropdown menu. `trigger` is rendered as the toggle;
 * children receive a `close` helper via render-prop or can use <DropdownItem>.
 */
export function Dropdown({ trigger, children, align = "right", className }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute z-40 mt-2 min-w-[12rem] rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow-pop)] animate-fade-up",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ className, danger, children, ...props }) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink transition hover:bg-surface-muted",
        danger && "text-rose-600 hover:bg-rose-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownLabel({ children }) {
  return (
    <p className="px-3 py-1.5 text-xs font-medium text-ink-soft">{children}</p>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-line" />;
}
