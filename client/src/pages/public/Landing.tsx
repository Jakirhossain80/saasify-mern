// FILE: client/src/pages/public/Landing.tsx
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { useAuth } from "../../hooks/useAuth";

export default function Landing() {
  const { logout } = useAuth({ bootstrap: false } as any);

  const user = useAuthStore((s) => s.user);
  const activeTenantSlug = useAuthStore((s) => s.activeTenantSlug);

  const dashboardTo =
    user?.platformRole === "platformAdmin"
      ? "/platform"
      : activeTenantSlug
        ? `/t/${activeTenantSlug}`
        : "/select-tenant";

  const tenantDashboardTo = activeTenantSlug ? `/t/${activeTenantSlug}` : "/select-tenant";
  const tenantProjectsTo = activeTenantSlug ? `/t/${activeTenantSlug}/projects` : "/select-tenant";

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <div className="text-slate-900 dark:text-slate-100">
      <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-24 lg:pt-28 lg:pb-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-700 text-xs font-semibold uppercase tracking-wider dark:text-blue-300 dark:border-blue-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-30 dark:bg-blue-400" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400" />
                </span>
                SaaSify-MERN
                <span className="text-blue-700/60 dark:text-blue-300/60">•</span>
                JWT • RBAC • Tenant isolation • Audit logs
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-slate-100 leading-[1.1] tracking-tight">
                Multi-tenant <span className="text-blue-600 dark:text-blue-400">Projects</span> Dashboard for Teams
              </h1>

              <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                Manage tenants, members, and projects with role-based access control and an auditable security model—built for
                real-world SaaS patterns.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/sign-up"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:shadow-lg hover:shadow-blue-600/20 transition-all"
                >
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/docs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                >
                  View docs <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-sm">
                <TrustPill title="Built with" value="React + TS + Express" />
                <TrustPill title="Patterns" value="RBAC + tenant isolation" />
                <TrustPill title="Ops-ready" value="Audit logs & safe errors" />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {user ? (
                  <>
                    <Link
                      to={dashboardTo}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Open dashboard <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={logout.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                    >
                      {logout.isPending ? "Signing out..." : "Sign out"}
                    </button>
                  </>
                ) : null}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl shadow-2xl overflow-hidden border border-slate-800 bg-slate-900 dark:border-slate-800 dark:bg-slate-900">
                <div className="px-4 pt-4">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4 dark:border-slate-800">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] text-slate-400 font-mono dark:bg-slate-800 dark:text-slate-400">
                      dashboard.saasify.io
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-5 space-y-4">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-slate-300">Active Tenants</span>
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">+12%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-3/4" />
                    </div>
                    <div className="mt-3 grid gap-2">
                      <MockRowDark name="Tenant A" meta="Active • slug: tenant-a" />
                      <MockRowDark name="Tenant B" meta="Active • slug: tenant-b" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 dark:border-slate-700">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Projects</div>
                      <div className="mt-1 text-2xl font-extrabold text-white">1,284</div>
                      <div className="mt-3 grid gap-2">
                        <MockRowDark name="Project Alpha" meta="active" />
                        <MockRowDark name="Project Beta" meta="archived" />
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 dark:border-slate-700">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Audit Logs</div>
                      <div className="mt-1 text-2xl font-extrabold text-white">45.2k</div>
                      <div className="mt-3 text-xs text-slate-300/80 space-y-1">
                        <div>• member updated project title</div>
                        <div>• tenantAdmin revoked invite</div>
                        <div>• tenantAdmin changed role</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 dark:border-slate-700">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <span className="text-blue-400 text-sm font-semibold">Σ</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 w-2/3 bg-slate-700 rounded-full" />
                        <div className="h-2 w-full bg-slate-700 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Tip: once your real dashboards are ready, replace this mock with screenshots.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-3xl mb-10 md:mb-14">
            <div className="text-blue-600 font-semibold text-xs uppercase tracking-widest mb-3 dark:text-blue-400">
              Enterprise Features
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Everything a tenant-first SaaS needs
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              SaaSify is designed around strict tenant isolation and role-based access—without sacrificing developer
              productivity.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Tenant Isolation"
              desc="Every tenant-scoped query enforces tenantId to prevent cross-tenant data leaks."
            />
            <FeatureCard
              title="RBAC (Platform + Tenant)"
              desc="platformAdmin for global control; tenantAdmin/member roles per tenant via Membership."
            />
            <FeatureCard
              title="Projects Module (Core)"
              desc="Create, list, update, archive/restore projects—strictly scoped by tenant and role."
            />
            <FeatureCard
              title="Invites + Memberships"
              desc="Invite users, assign roles, and manage membership lifecycle safely."
            />
            <FeatureCard
              title="Audit Logs"
              desc="Track sensitive actions with actor, action, targetId, and timestamp for accountability."
            />
            <FeatureCard
              title="Saved Views"
              desc="Let users save filters/views—scoped to both tenant and user for personalization."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Get running in 3 simple steps
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-base leading-relaxed max-w-2xl mx-auto">
              Set up a tenant, invite your team, and manage projects with predictable access control.
            </p>
          </div>

          <div className="mt-10 md:mt-14 grid gap-8 md:grid-cols-3">
            <StepCard step="1" title="Create a tenant" desc="Platform admin creates a tenant and assigns a slug." />
            <StepCard step="2" title="Invite members" desc="Tenant admin invites users and sets tenant roles." />
            <StepCard step="3" title="Run projects" desc="Create projects, track changes, and review audit logs for key actions." />
          </div>

          <div className="mt-12 md:mt-16 rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Quick Access:
            </span>

            <Link
              to="/platform"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-slate-950"
            >
              Platform dashboard <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to={tenantDashboardTo}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-slate-950"
              title={!activeTenantSlug ? "Select a tenant first" : undefined}
            >
              Tenant dashboard <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              to={tenantProjectsTo}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors dark:text-slate-200 dark:hover:text-blue-400 dark:hover:bg-slate-950"
              title={!activeTenantSlug ? "Select a tenant first" : undefined}
            >
              Projects <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Simple pricing
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              Start with the demo plan, then upgrade when your team grows.
            </p>
          </div>

          <div className="mt-10 md:mt-14 grid gap-6 lg:grid-cols-3">
            <PricingCard
              name="Free"
              price="$0"
              note="Demo / portfolio"
              items={["1 tenant", "Projects module", "Basic RBAC", "Community support"]}
              cta={{ label: "Start free", to: "/sign-up" }}
            />
            <PricingCard
              featured
              name="Pro"
              price="$19"
              note="Per tenant / month"
              items={["Unlimited projects", "Invites + members", "Audit logs", "Saved views"]}
              cta={{ label: "Start Pro", to: "/sign-up" }}
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              note="For organizations"
              items={["SLA + Support", "SSO (future)", "Advanced analytics (future)", "Custom policies"]}
              cta={{ label: "Contact sales", to: "#contact" }}
            />
          </div>
        </div>
      </section>

      <section id="security" className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Security & isolation by design
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              SaaSify follows production-grade practices: refresh rotation, HTTP-only cookies, strict tenant scoping, and safe
              error patterns.
            </p>
          </div>

          <div className="mt-10 md:mt-14 grid gap-6 md:grid-cols-3">
            <SecurityCard
              title="JWT + refresh rotation"
              desc="Access token in memory, refresh cookie httpOnly—better resilience against XSS."
            />
            <SecurityCard
              title="Tenant-scoped repos"
              desc="Tenant isolation enforced at repository layer: tenantId required on tenant queries."
            />
            <SecurityCard
              title="No existence leaks"
              desc="Prefer 404 over 403 where appropriate to avoid revealing cross-tenant resources."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function TrustPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</div>
      <div className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-600/20 hover:shadow-xl hover:shadow-blue-600/5 transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30">
      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</div>
      <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</div>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="relative text-center group">
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-6 font-extrabold text-2xl text-blue-600 group-hover:scale-110 transition-transform dark:bg-slate-900 dark:border-slate-800 dark:text-blue-400">
        {step}
      </div>
      <div className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">{title}</div>
      <div className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">{desc}</div>
    </div>
  );
}

function SecurityCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-5 dark:bg-green-500/10 dark:text-green-300">
        <Check className="h-5 w-5" />
      </div>
      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  note,
  items,
  cta,
  featured,
}: {
  name: string;
  price: string;
  note: string;
  items: string[];
  cta: { label: string; to: string };
  featured?: boolean;
}) {
  return (
    <div
      className={[
        "p-7 rounded-2xl border bg-white flex flex-col",
        "dark:border-slate-800 dark:bg-slate-900",
        featured
          ? "border-2 border-blue-600 bg-blue-600/[0.02] shadow-xl shadow-blue-600/10 scale-[1.02] dark:bg-blue-500/10"
          : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{note}</div>
        </div>
        {featured && (
          <div className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
            Most Popular
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{price}</div>
      </div>

      <ul className="mt-5 space-y-3 text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-3">
            <Check className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>{it}</span>
          </li>
        ))}
      </ul>

      {cta.to.startsWith("#") ? (
        <a
          href={cta.to}
          className={[
            "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
            featured
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-[1.01]"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
          ].join(" ")}
        >
          {cta.label} <ArrowRight className="h-4 w-4" />
        </a>
      ) : (
        <Link
          to={cta.to}
          className={[
            "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
            featured
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-[1.01]"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
          ].join(" ")}
        >
          {cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function MockRowDark({ name, meta }: { name: string; meta: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2 bg-slate-900/20">
      <div className="text-sm font-semibold text-slate-100">{name}</div>
      <div className="text-xs text-slate-400">{meta}</div>
    </div>
  );
}

