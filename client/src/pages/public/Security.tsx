import { ShieldCheck, Lock, Key, EyeOff } from "lucide-react";

export default function Security() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-slate-700">
            <ShieldCheck className="h-4 w-4" />
            Security
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Security & Tenant Isolation
          </h1>

          <p className="text-slate-600 leading-relaxed">
            SaaSify is built with production-grade security practices from day one.
            Data isolation, strict authorization, and safe authentication flows are
            first-class concerns — not afterthoughts.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
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

        <div className="mt-12 rounded-2xl border bg-slate-50 p-6 text-sm text-slate-600">
          <strong className="text-slate-900">Note:</strong> SaaSify follows real-world SaaS
          security patterns commonly used in modern B2B applications. Advanced features
          like SSO, rate limiting, and anomaly detection can be layered on later.
        </div>
      </div>
    </div>
  );
}

function SecurityCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border">
          {icon}
        </div>
        <div className="font-semibold">{title}</div>
      </div>

      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
