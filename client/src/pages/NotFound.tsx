// FILE: client/src/pages/tenant/NotFound.tsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 sm:p-12 text-center dark:bg-slate-900 dark:border-slate-800">
        <div className="mb-8 flex justify-center">
          <div className="relative flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full dark:bg-blue-500/10">
            <svg
              className="w-10 h-10 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-500/10 dark:text-blue-300">
              404 Error
            </span>
          </div>

          <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            404 — Not Found
          </div>

          <p className="text-base leading-7 text-slate-600 dark:text-slate-400">
            The page you’re looking for doesn’t exist. It might have been moved or deleted.
          </p>
        </div>

        <div className="mt-10">
          <Link
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-500/20"
            to="/"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

