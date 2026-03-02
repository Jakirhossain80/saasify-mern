// FILE: client/src/pages/public/Features.tsx
import { Link } from "react-router-dom";

type Feature = {
  title: string;
  desc: string;
  bullets: string[];
  icon: React.ReactNode;
};

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10">
      {children}
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-slate-600">
      <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-md bg-slate-900 text-white text-[11px]">
        ✓
      </span>
      <span className="leading-6">{children}</span>
    </li>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}

export default function Features() {
  const features: Feature[] = [
    {
      title: "Multi-Tenant Architecture",
      desc: "Tenant isolation baked into routing, APIs, and permission checks — so data never leaks across organizations.",
      bullets: [
        "Tenant-scoped APIs and guards",
        "Slug-based tenant routing (/t/:tenantSlug/...)",
        "Tenant context restored automatically",
      ],
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3.5 7.5 12 3l8.5 4.5V17L12 21l-8.5-4V7.5Z" />
          <path d="M12 3v18" />
          <path d="M3.5 7.5 12 12l8.5-4.5" />
        </svg>
      ),
    },
    {
      title: "RBAC & Role Gates",
      desc: "Clean access rules for platform admins, tenant admins, and members — enforced via UI + server.",
      bullets: [
        "Platform Admin vs Tenant Admin vs Member",
        "RoleGate for tenant pages (members/invites/analytics/settings)",
        "ProtectedRoute prevents unauthorized access",
      ],
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
          <path d="M20 21a8 8 0 0 0-16 0" />
          <path d="M17 8h4" />
          <path d="M19 6v4" />
        </svg>
      ),
    },
    {
      title: "Secure Auth (JWT + Refresh Cookies)",
      desc: "Token lifecycle that feels like a real production SaaS: refresh cookie → access token → session restore.",
      bullets: [
        "httpOnly refresh cookie strategy",
        "Axios withCredentials enabled",
        "Auto refresh-once flow for 401 responses",
      ],
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 11V7" />
          <path d="M9 11h6" />
          <path d="M7 11V9a5 5 0 0 1 10 0v2" />
          <path d="M6 11h12v9H6z" />
        </svg>
      ),
    },
    {
      title: "Projects Module",
      desc: "Tenant-scoped project management with clean UI patterns and analytics-friendly structure.",
      bullets: [
        "Active + archived projects split",
        "Safe routing within tenant context",
        "Easy to extend with tags, status, and audit trails",
      ],
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16" />
          <path d="M4 12h10" />
          <path d="M4 17h16" />
          <path d="M15 10l5 2-5 2v-4Z" />
        </svg>
      ),
    },
    {
      title: "Invites & Team Management",
      desc: "A practical onboarding flow for teams: invite members, manage roles, and control access.",
      bullets: [
        "Invite creation + status handling",
        "Member approval workflows (extendable)",
        "Admin-only members/invites pages",
      ],
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <path d="M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
          <path d="M17 11l2 2 3-3" />
        </svg>
      ),
    },
    {
      title: "Audit-Ready Tracking",
      desc: "Designed for SaaS operations: actions can be tracked and reviewed (platform & tenant scope).",
      bullets: [
        "Audit logs page for platform admins",
        "Works with real-world compliance thinking",
        "Extensible metadata pattern",
      ],
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 3h10v4H7z" />
          <path d="M6 7h12v14H6z" />
          <path d="M9 11h6" />
          <path d="M9 15h6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      {/* Hero */}
      <section className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 bottom-[-5rem] h-80 w-80 rounded-full bg-sky-100/50 blur-3xl"
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              SaaSify-MERN
              <span className="h-1 w-1 rounded-full bg-blue-400" />
              Features
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Enterprise-grade building blocks for a{" "}
              <span className="text-blue-600">multi-tenant SaaS</span>.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Everything is structured like a real product: role-based access, tenant isolation,
              secure authentication, and scalable dashboard modules — ready for your portfolio and beyond.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/sign-up"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
              >
                Start free
              </Link>
              <Link
                to="/sign-in"
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
              >
                Sign in
              </Link>
              <Link
                to="/"
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Back to Landing →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MiniStat label="Auth" value="JWT + Refresh Cookie" />
          <MiniStat label="Routing" value="Tenant Slug Based" />
          <MiniStat label="Access Control" value="RBAC + Guards" />
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto mt-12 max-w-7xl">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Core feature set
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Built to feel like a real SaaS, not a demo.
            </p>
          </div>

          <Link
            to="/pricing"
            className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 sm:inline-flex"
          >
            View pricing
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <IconWrap>{f.icon}</IconWrap>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  SaaS
                </span>
              </div>

              <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{f.desc}</p>

              <ul className="mt-4 space-y-2">
                {f.bullets.map((b) => (
                  <Check key={b}>{b}</Check>
                ))}
              </ul>

              <div className="mt-5 h-px w-full bg-slate-100" />

              <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Designed for real-world SaaS
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-12 max-w-7xl">
        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight">
                Ready to explore the dashboard?
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
                Sign in, pick a tenant, and experience the multi-tenant flow exactly like a real SaaS product.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/sign-in"
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-100 active:scale-95"
              >
                Sign in
              </Link>
              <Link
                to="/sign-up"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}