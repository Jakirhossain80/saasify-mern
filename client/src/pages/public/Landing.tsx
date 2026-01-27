// FILE: client/src/pages/public/Landing.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Github, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

type NavItem = { label: string; href: string };

export default function Landing() {
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Docs", href: "#docs" },
      { label: "Security", href: "#security" },
      { label: "Contact", href: "#contact" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">SaaSify</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            {navItems.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-slate-900">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-xs text-slate-600">
                  {user.email} • <span className="font-medium">{user.platformRole}</span>
                </span>
                <Link
                  to={user.platformRole === "platformAdmin" ? "/platform" : "/t/tenant-a"}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Open dashboard <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  Sign in
                </Link>
                <Link
                  to="/sign-up"
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                >
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            Menu
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="mx-auto max-w-6xl px-4 py-3 flex flex-col gap-3">
              <div className="flex flex-col gap-2 text-sm text-slate-700">
                {navItems.map((n) => (
                  <a key={n.href} href={n.href} className="py-1" onClick={() => setMobileOpen(false)}>
                    {n.label}
                  </a>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                {!user ? (
                  <>
                    <Link
                      to="/sign-in"
                      className="flex-1 rounded-lg border px-3 py-2 text-sm text-center hover:bg-slate-50"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/sign-up"
                      className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white text-center hover:bg-slate-800"
                      onClick={() => setMobileOpen(false)}
                    >
                      Start free
                    </Link>
                  </>
                ) : (
                  <Link
                    to={user.platformRole === "platformAdmin" ? "/platform" : "/t/tenant-a"}
                    className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white text-center hover:bg-slate-800"
                    onClick={() => setMobileOpen(false)}
                  >
                    Open dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-slate-700">
                <span className="font-medium">SaaSify-MERN</span>
                <span className="text-slate-400">•</span>
                <span>JWT • RBAC • Tenant isolation • Audit logs</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
                Multi-tenant Projects Dashboard for Teams
              </h1>

              <p className="text-slate-600 leading-relaxed">
                Manage tenants, members, and projects with role-based access control and an auditable security
                model—built for real-world SaaS patterns.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/sign-up"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-800"
                >
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#docs"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50"
                >
                  View docs <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              {/* Trust row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-sm">
                <TrustPill title="Built with" value="React + TS + Express" />
                <TrustPill title="Patterns" value="RBAC + tenant isolation" />
                <TrustPill title="Ops-ready" value="Audit logs & safe errors" />
              </div>
            </div>

            {/* Mock preview */}
            <div className="relative">
              <div className="rounded-2xl border bg-white shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Preview</div>
                  <div className="text-xs text-slate-500">Dashboard mock</div>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl border p-4">
                    <div className="text-xs text-slate-500">Platform</div>
                    <div className="mt-1 font-medium">Tenants</div>
                    <div className="mt-3 grid gap-2">
                      <MockRow name="Tenant A" meta="Active • slug: tenant-a" />
                      <MockRow name="Tenant B" meta="Active • slug: tenant-b" />
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="text-xs text-slate-500">Tenant</div>
                    <div className="mt-1 font-medium">Projects</div>
                    <div className="mt-3 grid gap-2">
                      <MockRow name="Project Alpha" meta="active" />
                      <MockRow name="Project Beta" meta="archived" />
                    </div>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="text-xs text-slate-500">Security</div>
                    <div className="mt-1 font-medium">Audit log</div>
                    <div className="mt-3 text-xs text-slate-600 space-y-1">
                      <div>• member updated project title</div>
                      <div>• tenantAdmin revoked invite</div>
                      <div>• tenantAdmin changed role</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Tip: once your real dashboards are ready, replace this mock with screenshots.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">Everything a tenant-first SaaS needs</h2>
            <p className="text-slate-600 text-sm md:text-base">
              SaaSify is designed around strict tenant isolation and role-based access—without sacrificing developer
              productivity.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* How it works */}
      <section className="border-t bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">How it works</h2>
            <p className="text-slate-600 text-sm md:text-base">
              Set up a tenant, invite your team, and manage projects with predictable access control.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StepCard step="1" title="Create a tenant" desc="Platform admin creates a tenant and assigns a slug." />
            <StepCard step="2" title="Invite members" desc="Tenant admin invites users and sets tenant roles." />
            <StepCard
              step="3"
              title="Run projects"
              desc="Create projects, track changes, and review audit logs for key actions."
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              to="/platform"
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-100"
            >
              Platform dashboard
            </Link>
            <Link
              to="/t/tenant-a"
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-100"
            >
              Tenant dashboard (example)
            </Link>
            <Link
              to="/t/tenant-a/projects"
              className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-100"
            >
              Projects (example)
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">Simple pricing</h2>
            <p className="text-slate-600 text-sm md:text-base">
              Start with the demo plan, then upgrade when your team grows.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
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

      {/* Security */}
      <section id="security" className="border-t bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">Security & isolation by design</h2>
            <p className="text-slate-600 text-sm md:text-base">
              SaaSify follows production-grade practices: refresh rotation, HTTP-only cookies, strict tenant scoping,
              and safe error patterns.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
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

      {/* Docs (placeholder) */}
      <section id="docs" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">Docs</h2>
            <p className="text-slate-600 text-sm md:text-base">
              Add your docs link here later (API usage, tenant model, RBAC matrix, Postman collection).
            </p>
          </div>

          <div className="mt-6 rounded-2xl border p-6 text-sm text-slate-600">
            Suggested docs pages:
            <ul className="mt-3 list-disc pl-5 space-y-1">
              <li>Getting Started (local setup)</li>
              <li>Auth flow (access + refresh)</li>
              <li>Tenant routing (/t/:tenantSlug)</li>
              <li>RBAC rules (platform vs tenant roles)</li>
              <li>Audit logs & safe error policy</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">FAQ</h2>
            <p className="text-slate-600 text-sm md:text-base">
              Common questions for a tenant-first Projects dashboard.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <FaqItem
              q="Is data isolated per tenant?"
              a="Yes. Tenant-scoped repositories require tenantId, and cross-tenant access is blocked (often with 404 to avoid leaks)."
            />
            <FaqItem
              q="How is authentication handled?"
              a="JWT access token (Bearer) for requests + refresh token stored as an HTTP-only cookie with rotation."
            />
            <FaqItem
              q="Can members see admin actions?"
              a="Members can view allowed resources, but tenantAdmin-only actions are gated in UI and enforced on the server."
            />
            <FaqItem
              q="Do you support audit logs?"
              a="Yes. Key actions (projects, invites, memberships) write audit logs with actor, action, target and timestamp."
            />
            <FaqItem
              q="Can I self-host?"
              a="Yes. It's a standard MERN setup (Vite client + Express server + MongoDB Atlas)."
            />
            <FaqItem
              q="Is this production ready?"
              a="The foundations are production-grade. UI polish and advanced features (SSO, billing, analytics) can be added next."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="rounded-2xl border bg-white p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="text-xl md:text-2xl font-semibold">Start organizing projects across tenants today.</div>
              <div className="text-sm text-slate-600">
                Build on a secure multi-tenant foundation with RBAC and audit logs.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-800"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/sign-in"
                className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-2">
              <div className="font-semibold">SaaSify</div>
              <div className="text-sm text-slate-600">
                A multi-tenant Projects dashboard built with MERN + TypeScript.
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="font-medium">Product</div>
              <div className="text-slate-600 space-y-1">
                <a href="#features" className="block hover:text-slate-900">
                  Features
                </a>
                <a href="#pricing" className="block hover:text-slate-900">
                  Pricing
                </a>
                <a href="#docs" className="block hover:text-slate-900">
                  Docs
                </a>
                <a href="#security" className="block hover:text-slate-900">
                  Security
                </a>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="font-medium">Company</div>
              <div className="text-slate-600 space-y-1">
                <a href="#contact" className="block hover:text-slate-900">
                  Contact
                </a>
                <span className="block">About (coming soon)</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="font-medium">Legal</div>
              <div className="text-slate-600 space-y-1">
                <span className="block">Privacy (coming soon)</span>
                <span className="block">Terms (coming soon)</span>
              </div>

              <div className="pt-2">
                <a
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  <Github className="h-4 w-4" />
                  GitHub (add link)
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6 text-xs text-slate-500">
            © {new Date().getFullYear()} SaaSify. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function TrustPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white px-4 py-3">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="font-semibold">{title}</div>
      <div className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</div>
    </div>
  );
}

function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold">
        {step}
      </div>
      <div className="mt-3 font-semibold">{title}</div>
      <div className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</div>
    </div>
  );
}

function SecurityCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4" />
        <div className="font-semibold">{title}</div>
      </div>
      <div className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</div>
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
        "rounded-2xl border bg-white p-6 shadow-sm",
        featured ? "ring-2 ring-slate-900" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-slate-500 mt-1">{note}</div>
        </div>
        {featured && (
          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">Popular</div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-3xl font-semibold">{price}</div>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5" />
            <span>{it}</span>
          </li>
        ))}
      </ul>

      {cta.to.startsWith("#") ? (
        <a
          href={cta.to}
          className={[
            "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm",
            featured ? "bg-slate-900 text-white hover:bg-slate-800" : "border hover:bg-slate-50",
          ].join(" ")}
        >
          {cta.label} <ArrowRight className="h-4 w-4" />
        </a>
      ) : (
        <Link
          to={cta.to}
          className={[
            "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm",
            featured ? "bg-slate-900 text-white hover:bg-slate-800" : "border hover:bg-slate-50",
          ].join(" ")}
        >
          {cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="font-semibold">{q}</div>
      <div className="mt-2 text-sm text-slate-600 leading-relaxed">{a}</div>
    </div>
  );
}

function MockRow({ name, meta }: { name: string; meta: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="text-sm font-medium">{name}</div>
      <div className="text-xs text-slate-500">{meta}</div>
    </div>
  );
}
