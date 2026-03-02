// FILE: client/src/layouts/AuthLayout.tsx
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="flex min-h-screen w-full">
        {/* Left Panel (Desktop Only) */}
        <aside className="relative hidden lg:flex lg:w-[45%] flex-col overflow-hidden border-r border-slate-200 bg-white p-10 xl:p-12">
          {/* Background blobs */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-[-4rem] h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

          {/* Brand */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <span className="text-lg font-black">S</span>
            </div>
            <div className="leading-tight">
              <div className="text-xl font-bold tracking-tight text-slate-900">SaaSify</div>
              <div className="text-xs font-medium tracking-wide text-slate-500">Multi-tenant SaaS Dashboard</div>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 mt-auto">
            <h1 className="max-w-lg text-4xl font-extrabold leading-tight tracking-tight text-slate-900">
              The foundation for your <span className="text-sky-600">multi-tenant SaaS</span>.
            </h1>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              Secure authentication with role-based access control, strict tenant isolation, and audit-ready tracking—
              designed for real-world SaaS patterns.
            </p>

            <div className="mt-8 space-y-5">
              <FeaturePill title="RBAC & Permissions" desc="Fine-grained access control for teams and organizations." />
              <FeaturePill title="Tenant Isolation" desc="Tenant-scoped design to prevent cross-tenant data leaks." />
              <FeaturePill title="Audit Logs & Security" desc="Compliance-friendly activity tracking for key actions." />
            </div>
          </div>

          {/* Abstract visual */}
          <div className="relative z-10 mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div className="grid grid-cols-6 gap-2 opacity-25">
              <div className="col-span-4 h-8 rounded bg-sky-500" />
              <div className="col-span-2 h-8 rounded bg-slate-300" />
              <div className="col-span-2 h-24 rounded bg-slate-300" />
              <div className="col-span-4 h-24 rounded bg-sky-500/50" />
              <div className="col-span-3 h-12 rounded bg-slate-300" />
              <div className="col-span-3 h-12 rounded bg-sky-500/30" />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white to-transparent" />
          </div>
        </aside>

        {/* Right Panel (Auth Container) */}
        <main className="flex w-full flex-col items-center justify-center px-4 py-10 md:px-8 lg:w-[55%]">
          {/* Auth Card */}
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_35px_rgba(2,6,23,0.06)]">
            <div className="p-6 sm:p-8">
              {/* Card Header */}
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                  <span className="text-xl font-black">S</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">SaaSify</h2>
                <p className="mt-1 text-sm text-slate-500">Sign in or create an account to continue.</p>
              </div>

              {/* ✅ Outlet container (DO NOT REMOVE) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <Outlet />
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <footer className="mt-10 flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium uppercase tracking-widest text-slate-500">
              <a href="#" className="hover:text-sky-600 transition-colors" onClick={(e) => e.preventDefault()}>
                Terms of Service
              </a>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <a href="#" className="hover:text-sky-600 transition-colors" onClick={(e) => e.preventDefault()}>
                Privacy Policy
              </a>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <a href="/" className="hover:text-sky-600 transition-colors">
                Back to Home
              </a>
            </div>
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} SaaSify. All rights reserved.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function FeaturePill({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-sky-600 shadow-sm">
        <span className="text-sm font-bold">✓</span>
      </div>
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</div>
      </div>
    </div>
  );
}