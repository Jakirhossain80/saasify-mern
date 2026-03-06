// FILE: client/src/pages/auth/SignIn.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function SignIn() {
  const nav = useNavigate();
  const loc = useLocation();

  // ✅ IMPORTANT: do NOT bootstrap from inside SignIn page
  const { login, user, isBootstrapped } = useAuth({ bootstrap: false });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const from = (loc.state as any)?.from as string | undefined;

  useEffect(() => {
    if (!isBootstrapped) return; // wait for app bootstrap (prevents flicker)
    if (!user) return;

    if (from) {
      nav(from, { replace: true });
      return;
    }

    nav("/select-tenant", { replace: true });
  }, [user, from, nav, isBootstrapped]);

  return (
    // ✅ IMPORTANT: AuthLayout already handles page centering and layout.
    // This wrapper must NOT be min-h-screen (prevents double height + scrollbar).
    <div className="w-full">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          {/* Header */}
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15 dark:bg-slate-50 dark:text-slate-900 dark:shadow-none">
              <span aria-hidden className="text-2xl leading-none">
                {"</>"}
              </span>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white">
                Sign in
              </h1>
              <p className="text-slate-500 text-sm mt-2 dark:text-slate-400">
                Use your SaaSify-MERN credentials.
              </p>
            </div>
          </div>

          {/* Error Slot (UI only; no logic change) */}
          <div className="hidden mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
            <div className="flex gap-3 items-start">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-rose-200 text-rose-600 dark:bg-slate-900 dark:border-rose-900/40 dark:text-rose-400">
                <span aria-hidden className="text-lg leading-none">
                  !
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-rose-900 text-sm font-semibold leading-tight dark:text-rose-200">
                  Error
                </p>
                <p className="text-rose-700 text-xs leading-normal dark:text-rose-300">
                  Subtle red alert area for potential error messages
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            className="mt-8 flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate({ email: email.trim().toLowerCase(), password });
            }}
          >
            <div className="flex flex-col gap-2">
              <label
                className="text-[11px] font-bold tracking-wider text-slate-500 uppercase ml-1 dark:text-slate-400"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm shadow-slate-200/40 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@saasify.dev"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[11px] font-bold tracking-wider text-slate-500 uppercase ml-1 dark:text-slate-400"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm shadow-slate-200/40 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-600 transition-all dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </div>

            <button
              className={[
                "mt-1 w-full h-12 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/30",
                login.isPending
                  ? "bg-slate-900/80 text-white/80 cursor-not-allowed shadow-none"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 dark:shadow-none",
              ].join(" ")}
              type="submit"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

            {/* ✅ Added Sign Up link (UI only) */}
            <p className="pt-1 text-center text-sm text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                to="/sign-up"
                className="font-semibold text-slate-900 hover:underline dark:text-slate-100"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
          <div className="h-4 w-4 opacity-50" aria-hidden="true">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <span className="text-xs font-medium tracking-tight">SaaSify-MERN</span>
        </div>
      </div>
    </div>
  );
}