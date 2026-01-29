import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-slate-600">
            Start free for demos and portfolios. Upgrade when your team and needs grow.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <PricingCard
            name="Free"
            price="$0"
            note="Demo / portfolio"
            items={[
              "1 tenant",
              "Projects module",
              "Basic RBAC",
              "Community support",
            ]}
            cta={{ label: "Start free", to: "/sign-up" }}
          />

          <PricingCard
            featured
            name="Pro"
            price="$19"
            note="Per tenant / month"
            items={[
              "Unlimited projects",
              "Invites + members",
              "Audit logs",
              "Saved views",
            ]}
            cta={{ label: "Start Pro", to: "/sign-up" }}
          />

          <PricingCard
            name="Enterprise"
            price="Custom"
            note="Organizations"
            items={[
              "Custom policies",
              "Priority support",
              "SSO (future)",
              "Advanced analytics (future)",
            ]}
            cta={{ label: "Contact sales", to: "#" }}
          />
        </div>

        <div className="mt-12 rounded-2xl border bg-slate-50 p-6 text-sm text-slate-600">
          Pricing is illustrative for demo purposes. SaaSify focuses on architecture,
          security, and scalability rather than billing logic in the MVP.
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
          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
            Popular
          </div>
        )}
      </div>

      <div className="mt-4 text-3xl font-semibold">{price}</div>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <Check className="h-4 w-4 mt-0.5" />
            <span>{it}</span>
          </li>
        ))}
      </ul>

      {cta.to.startsWith("#") ? (
        <button
          className={[
            "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm",
            featured
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "border hover:bg-slate-50",
          ].join(" ")}
        >
          {cta.label} <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <Link
          to={cta.to}
          className={[
            "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm",
            featured
              ? "bg-slate-900 text-white hover:bg-slate-800"
              : "border hover:bg-slate-50",
          ].join(" ")}
        >
          {cta.label} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
