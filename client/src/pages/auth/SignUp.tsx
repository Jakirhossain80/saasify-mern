// FILE: client/src/pages/auth/SignUp.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Rocket } from "lucide-react";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";
import { useAuthStore } from "../../store/auth.store";
import type { LoginResponse } from "../../types/auth.types";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type RegisterResponse = Partial<LoginResponse> & {
  accessToken?: string;
  user?: unknown;
};

type HttpErrorShape = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getErrorMessage(err: unknown) {
  if (isObject(err)) {
    const e = err as HttpErrorShape;
    return e.response?.data?.message || e.message || "Sign up failed";
  }
  return "Sign up failed";
}

export default function SignUp() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Visual-only password UX (no logic change)
  const [showPassword, setShowPassword] = useState(false);

  // ✅ If signup auto-logs in (user exists), move away from auth UI
  useEffect(() => {
    if (user) {
      nav("/select-tenant", { replace: true });
    }
  }, [user, nav]);

  const register = useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await http.post<RegisterResponse>(API.auth.register, input);
      return data;
    },
    onSuccess: (data) => {
      // Some servers auto-login and return { accessToken, user }
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        if (data?.user) setUser(data.user as never);
        toast.success("Account created");
        // ✅ Let the useEffect redirect when user is set (or fallback below if user not returned)
        if (!data?.user) nav("/select-tenant", { replace: true });
        return;
      }

      // Otherwise, redirect to sign-in
      toast.success("Account created. Please sign in.");
      nav("/sign-in", { replace: true });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err));
    },
  });

  return (
    // ✅ IMPORTANT: AuthLayout is the wrapper. Keep SignUp compact (no min-h-screen here).
    <div className="w-full">
      <div className="mx-auto w-full max-w-[420px]">
        {/* Compact inner panel (prevents “full-height form” feel) */}
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-7 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-none">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shadow-slate-900/10 dark:bg-slate-50 dark:text-slate-900 dark:shadow-none">
              <Rocket className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Create your account
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Start using SaaSify-MERN.
              </p>
            </div>
          </div>

          {/* Form */}
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();

              const trimmedEmail = email.trim().toLowerCase(); // avoid email casing mismatch
              register.mutate({
                name: name.trim(),
                email: trimmedEmail,
                password,
              });
            }}
          >
            <div className="space-y-1.5">
              <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Name
              </label>
              <input
                className="block h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm shadow-slate-200/40 transition-all focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Email
              </label>
              <input
                className="block h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm shadow-slate-200/40 transition-all focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@saasify.dev"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Min 8 chars</span>
              </div>

              <div className="relative">
                <input
                  className="block h-11 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm shadow-slate-200/40 transition-all focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100 dark:placeholder:text-slate-500 dark:shadow-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 my-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              className={[
                "mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/30",
                register.isPending
                  ? "bg-slate-900/80 text-white/80 cursor-not-allowed shadow-none"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/10 dark:shadow-none",
              ].join(" ")}
              type="submit"
              disabled={register.isPending}
            >
              {register.isPending ? "Creating..." : "Create account"}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-5 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link className="font-semibold text-slate-900 hover:underline dark:text-slate-100" to="/sign-in">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}