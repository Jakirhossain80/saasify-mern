// FILE: client/src/pages/public/Docs.tsx
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";

export default function Docs() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-12 md:py-20">
        {/* Central Content Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Hero Section */}
          <div className="p-8 md:p-12 text-center">
            <div className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-slate-900 dark:border-blue-600/30 dark:bg-blue-600/10 dark:text-slate-100">
              <BookOpen className="h-6 w-6" />
            </div>

            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
              Documentation
            </h1>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 md:text-lg">
              SaaSify documentation is coming soon.
              <br />
              This section will include setup guides, API usage, tenant model, RBAC rules, and Postman collections.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950 dark:focus:ring-slate-800"
              >
                Back to home
              </Link>

              <Link
                to="/sign-up"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-200 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:focus:ring-slate-800"
              >
                Start free{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Planned Docs Section */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/50 md:p-12">
            <div className="mb-6 flex items-center justify-center gap-2 md:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                Planned docs
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900/10 text-xs font-bold text-slate-900 dark:bg-slate-100/10 dark:text-slate-100">
                  1
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Getting started (local setup)
                </span>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900/10 text-xs font-bold text-slate-900 dark:bg-slate-100/10 dark:text-slate-100">
                  2
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Auth flow (access + refresh tokens)
                </span>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900/10 text-xs font-bold text-slate-900 dark:bg-slate-100/10 dark:text-slate-100">
                  3
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tenant routing:{" "}
                  <code className="mx-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
                    /t/:tenantSlug
                  </code>
                </span>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900/10 text-xs font-bold text-slate-900 dark:bg-slate-100/10 dark:text-slate-100">
                  4
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  RBAC matrix (platform vs tenant)
                </span>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900/10 text-xs font-bold text-slate-900 dark:bg-slate-100/10 dark:text-slate-100">
                  5
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Projects module API</span>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900/10 text-xs font-bold text-slate-900 dark:bg-slate-100/10 dark:text-slate-100">
                  6
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Audit logs &amp; security model</span>
              </div>
            </div>

            {/* Keep original "Planned docs:" label concept present (content preserved) */}
            <div className="sr-only">
              <div className="font-medium mb-2">Planned docs:</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Getting started (local setup)</li>
                <li>Auth flow (access + refresh tokens)</li>
                <li>
                  Tenant routing: <code>/t/:tenantSlug</code>
                </li>
                <li>RBAC matrix (platform vs tenant)</li>
                <li>Projects module API</li>
                <li>Audit logs &amp; security model</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            © 2024 SaaSify-MERN Framework. Built for speed and scale.
          </p>
        </div>
      </div>
    </div>
  );
}