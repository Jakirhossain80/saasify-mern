// FILE: client/src/pages/public/Docs.tsx
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";

export default function Docs() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl border">
          <BookOpen className="h-6 w-6" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">Documentation</h1>

        <p className="mt-4 text-slate-600 leading-relaxed">
          SaaSify documentation is coming soon.
          <br />
          This section will include setup guides, API usage, tenant model,
          RBAC rules, and Postman collections.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm hover:bg-slate-50"
          >
            Back to home
          </Link>

          <Link
            to="/sign-up"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-800"
          >
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border bg-slate-50 p-6 text-left text-sm text-slate-700">
          <div className="font-medium mb-2">Planned docs:</div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Getting started (local setup)</li>
            <li>Auth flow (access + refresh tokens)</li>
            <li>Tenant routing: <code>/t/:tenantSlug</code></li>
            <li>RBAC matrix (platform vs tenant)</li>
            <li>Projects module API</li>
            <li>Audit logs & security model</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
