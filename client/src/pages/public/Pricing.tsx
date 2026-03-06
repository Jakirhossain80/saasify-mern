// FILE: client/src/pages/public/Pricing.tsx
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800">
            Pricing plans
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 md:text-6xl">
            Simple, transparent pricing
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400 md:text-xl">
            Start free for demos and portfolios. Upgrade when your team and needs grow.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3 md:gap-8">
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
            note="Organizations"
            items={["Custom policies", "Priority support", "SSO (future)", "Advanced analytics (future)"]}
            cta={{ label: "Contact sales", to: "#" }}
          />
        </div>

        {/* Informational Callout */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-100 p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 md:p-8">
          Pricing is illustrative for demo purposes. SaaSify focuses on architecture, security, and scalability rather than
          billing logic in the MVP.
        </div>
      </div>
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
  const cardClassName = [
    "group relative flex h-full flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300",
    "border-slate-200 hover:shadow-md",
    "dark:border-slate-800 dark:bg-slate-900",
    featured ? "border-2 border-indigo-600 shadow-xl shadow-indigo-600/10 md:scale-[1.03] md:-translate-y-1" : "",
  ].join(" ");

  const badge = featured ? (
    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-indigo-600/30">
      Most Popular
    </div>
  ) : null;

  const headerBadge = featured ? (
    <div className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white dark:bg-slate-100 dark:text-slate-900">
      Popular
    </div>
  ) : null;

  const ctaClassName = [
    "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all",
    "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-500/20",
    featured
      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0"
      : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-950",
  ].join(" ");

  return (
    <div className={cardClassName}>
      {badge}

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{name}</div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{note}</div>
        </div>
        {headerBadge}
      </div>

      <div className="mb-8 flex items-baseline gap-2">
        <div className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">{price}</div>
      </div>

      <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600/10 dark:bg-indigo-500/15">
              <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </span>
            <span className={featured ? "font-medium text-slate-700 dark:text-slate-200" : ""}>{it}</span>
          </li>
        ))}
      </ul>

      {cta.to.startsWith("#") ? (
        <button className={ctaClassName}>
          {cta.label} <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <Link to={cta.to} className={ctaClassName}>
          {cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}