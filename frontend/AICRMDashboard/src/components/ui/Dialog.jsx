import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Accessible modal dialog rendered through a portal.
 * Closes on Escape and overlay click; locks body scroll while open.
 */
export function Dialog({ open, onClose, title, description, children, className }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-[fade-up_.2s_ease]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-lg bg-surface rounded-3xl shadow-[var(--shadow-pop)] animate-fade-up max-h-[90vh] overflow-y-auto no-scrollbar",
          className
        )}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 p-6 pb-2">
            <div>
              {title && <h3 className="text-lg font-semibold text-ink">{title}</h3>}
              {description && (
                <p className="text-sm text-ink-soft mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-ink-soft hover:text-ink rounded-lg p-1 hover:bg-surface-muted transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-6 pt-2">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Right-side slide-over drawer (used for record detail panels).
 */
export function Drawer({ open, onClose, title, children, className }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-md bg-canvas shadow-[var(--shadow-pop)] overflow-y-auto no-scrollbar",
          "animate-[slidein_.3s_cubic-bezier(.16,1,.3,1)]",
          className
        )}
        style={{ animationName: "slidein" }}
      >
        <style>{`@keyframes slidein{from{transform:translateX(24px);opacity:.6}to{transform:translateX(0);opacity:1}}`}</style>
        <div className="sticky top-0 z-10 flex items-center justify-between bg-canvas/90 backdrop-blur px-6 py-4 border-b border-line">
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink rounded-lg p-1 hover:bg-surface-muted transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
