// FILE: client/src/layouts/PlatformLayout.tsx
import { Outlet } from "react-router-dom";

export default function PlatformLayout() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      {/* Skip link (a11y) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      {/* ✅ Platform pages (PlatformDashboard/AuditLogs) render PageShell themselves.
          So PlatformLayout must NOT render another header/navbar. */}
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
