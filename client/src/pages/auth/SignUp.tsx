// FILE: client/src/pages/auth/SignUp.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Rocket } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="relative flex min-h-screen items-center justify-center p-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-60"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-slate-200 blur-3xl dark:bg-slate-800" />
          <div className="absolute right-10 top-40 h-56 w-56 rounded-full bg-slate-100 blur-3xl dark:bg-slate-900" />
        </div>

        <div className="relative w-full max-w-[448px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shadow-slate-900/10 dark:bg-slate-100 dark:text-slate-900 dark:shadow-none">
                <Rocket className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Sign up
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Create your SaaSify account.
              </p>
            </div>

            {/* Inline Error Slot (visual placeholder only) */}
            <div className="hidden mb-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              Please check the details and try again.
            </div>

            {/* Form */}
            <form
              className="space-y-5"
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
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Name
                </label>
                <input
                  className="block h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 shadow-sm shadow-slate-900/5 transition-all focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:shadow-none dark:focus:border-slate-200 dark:focus:ring-slate-100/10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  className="block h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 shadow-sm shadow-slate-900/5 transition-all focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:shadow-none dark:focus:border-slate-200 dark:focus:ring-slate-100/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@saasify.dev"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  className="block h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 shadow-sm shadow-slate-900/5 transition-all focus:border-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:shadow-none dark:focus:border-slate-200 dark:focus:ring-slate-100/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  type="password"
                  autoComplete="new-password"
                />
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    i
                  </span>
                  Use at least 8 characters.
                </p>
              </div>

              <button
                className={[
                  "mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors",
                  "bg-slate-900 text-white shadow-sm shadow-slate-900/10 hover:bg-slate-800",
                  "disabled:cursor-not-allowed disabled:opacity-70",
                  "dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:shadow-none",
                ].join(" ")}
                type="submit"
                disabled={register.isPending}
              >
                {register.isPending ? "Creating..." : "Create account"}
              </button>
            </form>

            {/* Footer Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  className="font-semibold text-slate-900 hover:underline dark:text-slate-100"
                  to="/sign-in"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Decorative Footer Bottom */}
          <div className="flex justify-center gap-6 border-t border-slate-100 bg-slate-50 px-8 py-4 dark:border-slate-800 dark:bg-slate-800/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Secure SSL Encryption
            </span>
          </div>
        </div>

        {/* Optional Helper Slot Area */}
        <div className="absolute bottom-6 left-1/2 w-full max-w-[448px] -translate-x-1/2 px-4">
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>© 2024 SaaSify Inc.</span>
            <div className="flex gap-4">
              <a className="hover:text-slate-600 dark:hover:text-slate-300" href="#">
                Privacy
              </a>
              <a className="hover:text-slate-600 dark:hover:text-slate-300" href="#">
                Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}