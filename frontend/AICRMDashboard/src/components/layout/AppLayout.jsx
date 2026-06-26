import { useState } from "react";
import { Outlet } from "react-router-dom";
import { IconRail } from "./IconRail";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

/**
 * Authenticated app shell matching the reference fintech dashboard:
 *  - a floating icon-only rail on the left (desktop)
 *  - a labelled slide-in drawer on mobile
 *  - a floating top nav (brand + centered link pill + actions)
 *  - an airy, scrollable content region.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Desktop icon rail */}
      <div className="hidden shrink-0 pl-3 lg:flex">
        <IconRail />
      </div>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full animate-[slidein_.25s_ease]">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="px-4 pt-4 md:px-6 md:pt-5">
          <TopNav onMenuClick={() => setMobileOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
