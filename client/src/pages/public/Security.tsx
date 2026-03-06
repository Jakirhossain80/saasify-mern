// FILE: client/src/pages/public/Security.tsx
import type { ReactNode } from "react";
import { ShieldCheck, Lock, Key, EyeOff } from "lucide-react";

export default function Security() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        {/* Hero */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-600/10 dark:text-blue-300">
            <ShieldCheck className="h-4 w-4" />
            Security
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
            Security &amp; Tenant Isolation
          </h1>

          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
            SaaSify is built with production-grade security practices from day one. Data isolation, strict authorization, and
            safe authentication flows are first-class concerns — not afterthoughts.
          </p>

          <div className="mt-8 h-px w-full bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Feature Grid */}
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:mt-12 lg:gap-8">
          <SecurityCard
            icon={<Key className="h-5 w-5" />}
            title="JWT + Refresh Token Rotation"
            desc="Short-lived access tokens combined with HTTP-only refresh tokens. Refresh tokens are rotated on every use to reduce replay risk."
          />

          <SecurityCard
            icon={<Lock className="h-5 w-5" />}
            title="Strict Tenant Isolation"
            desc="Every tenant-scoped query requires tenantId at the repository layer, preventing cross-tenant data access by design."
          />

          <SecurityCard
            icon={<EyeOff className="h-5 w-5" />}
            title="Safe Error Strategy"
            desc="We prefer 404 over 403 where applicable to avoid leaking the existence of resources across tenants."
          />

          <SecurityCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Role-Based Access Control (RBAC)"
            desc="Clear separation between platformAdmin and tenant-level roles (tenantAdmin, member), enforced both in UI and API."
          />
        </div>

        {/* Bottom Callout */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-blue-600/20 bg-white shadow-sm dark:border-blue-500/30 dark:bg-slate-900 lg:mt-16">
          <div className="relative p-6 sm:p-8">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-600" />
            <div className="pl-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-600/10 dark:text-blue-300 dark:ring-blue-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">Note</div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
                <strong className="text-slate-900 dark:text-slate-100">Note:</strong> SaaSify follows real-world SaaS
                security patterns commonly used in modern B2B applications. Advanced features like SSO, rate limiting, and
                anomaly detection can be layered on later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-600/30 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-600/10 dark:text-blue-300 dark:ring-blue-500/20">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</div>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}