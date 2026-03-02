// FILE: client/src/pages/auth/SignIn.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function SignIn() {
  const nav = useNavigate();
  const loc = useLocation();

  // ✅ IMPORTANT: do NOT bootstrap from inside SignIn page
  const { login, user, isBootstrapped } = useAuth({ bootstrap: false });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const from = (loc.state as any)?.from as string | undefined;

  // ✅ FIX: After successful login, redirect away from SignIn page
  // - Keep UI exactly the same
  // - Only add the redirect logic
  useEffect(() => {
    if (!isBootstrapped) return; // wait for app bootstrap (prevents flicker)
    if (!user) return;

    // If user came from a protected route, go back there
    if (from) {
      nav(from, { replace: true });
      return;
    }

    // Otherwise, go to tenant selection (best default in SaaSify)
    nav("/select-tenant", { replace: true });
  }, [user, from, nav, isBootstrapped]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
              <span aria-hidden className="text-2xl leading-none">
                {"</>"}
              </span>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight leading-tight text-slate-900">
                Sign in
              </h1>
              <p className="text-slate-500 text-sm mt-2">
                Use your SaaSify-MERN credentials.
              </p>
            </div>
          </div>

          {/* Error Slot (UI only; no logic change) */}
          <div className="hidden rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex gap-3 items-start">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-rose-200 text-rose-600">
                <span aria-hidden className="text-lg leading-none">
                  !
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-rose-900 text-sm font-semibold leading-tight">
                  Error
                </p>
                <p className="text-rose-700 text-xs leading-normal">
                  Subtle red alert area for potential error messages
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              login.mutate({ email: email.trim().toLowerCase(), password });
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase ml-1">
                Email
              </label>
              <input
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@saasify.dev"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase ml-1">
                Password
              </label>
              <input
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </div>

            <button
              className={[
                "mt-2 w-full h-12 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                login.isPending
                  ? "bg-slate-900/80 text-white/80 cursor-not-allowed shadow-none"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10",
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
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center flex items-center justify-center gap-2 text-slate-400">
          <div className="h-4 w-4 opacity-50" aria-hidden="true">
            <svg
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
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