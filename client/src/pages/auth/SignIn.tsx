// FILE: client/src/pages/auth/SignIn.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";

function getErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const e = err as {
      message?: unknown;
      response?: { data?: { message?: unknown } };
    };

    const apiMsg = e.response?.data?.message;
    if (typeof apiMsg === "string" && apiMsg.trim()) return apiMsg;

    const msg = e.message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }

  return "Sign in failed. Please try again.";
}

export default function SignIn() {
  const nav = useNavigate();
  const loc = useLocation();

  // ✅ IMPORTANT: do NOT bootstrap from inside SignIn page
  const { login, user, isBootstrapped } = useAuth({ bootstrap: false });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ IMPORTANT:
  // Read preserved full path from ProtectedRoute
  const from =
    typeof (loc.state as { from?: unknown } | null)?.from === "string"
      ? (loc.state as { from?: string }).from
      : undefined;

  useEffect(() => {
    if (!isBootstrapped) return;
    if (!user) return;

    // ✅ If user originally came from invite-accept URL,
    // send them back there first.
    if (from && from.trim()) {
      nav(from, { replace: true });
      return;
    }

    nav("/select-tenant", { replace: true });
  }, [user, from, nav, isBootstrapped]);

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15 dark:bg-slate-50 dark:text-slate-900 dark:shadow-none">
              <span aria-hidden className="text-2xl leading-none">
                {"</>"}
              </span>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                Sign in
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Use your SaaSify-MERN credentials.
              </p>
            </div>
          </div>

          <div className="hidden mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/30">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 dark:border-rose-900/40 dark:bg-slate-900 dark:text-rose-400">
                <span aria-hidden className="text-lg leading-none">
                  !
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold leading-tight text-rose-900 dark:text-rose-200">
                  Error
                </p>
                <p className="text-xs leading-normal text-rose-700 dark:text-rose-300">
                  Subtle red alert area for potential error messages
                </p>
              </div>
            </div>
          </div>

          <form
            className="mt-8 flex flex-col gap-5"
            onSubmit={async (e) => {
              e.preventDefault();

              try {
                await login.mutateAsync({
                  email: email.trim().toLowerCase(),
                  password,
                });
                toast.success("Signed in successfully.");
              } catch (err) {
                toast.error(getErrorMessage(err));
              }
            }}
          >
            <div className="flex flex-col gap-2">
              <label
                className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm shadow-slate-200/40 transition-all placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@saasify.dev"
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm shadow-slate-200/40 transition-all placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100 dark:shadow-none dark:placeholder:text-slate-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </div>

            <button
              className={[
                "mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold transition-all",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/30",
                login.isPending
                  ? "cursor-not-allowed bg-slate-900/80 text-white/80 shadow-none"
                  : "bg-slate-900 text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 dark:shadow-none",
              ].join(" ")}
              type="submit"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin text-white"
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
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

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

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-slate-400 dark:text-slate-500">
          <div className="h-4 w-4 opacity-50" aria-hidden="true">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="text-xs font-medium tracking-tight">SaaSify-MERN</span>
        </div>
      </div>
    </div>
  );
}
