// FILE: client/src/pages/auth/SignUp.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";
import { useAuthStore } from "../../store/auth.store";
import type { LoginResponse } from "../../types/auth.types";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export default function SignUp() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // If already logged in, go home
  useEffect(() => {
    if (user) nav("/", { replace: true });
  }, [user, nav]);

  const register = useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await http.post<LoginResponse | { user?: any }>(API.auth.register, input);
      return data;
    },
    onSuccess: (data: any) => {
      // Some servers auto-login and return { accessToken, user }
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        if (data?.user) setUser(data.user);
        toast.success("Account created");
        nav("/", { replace: true });
        return;
      }

      // Otherwise, redirect to sign-in
      toast.success("Account created. Please sign in.");
      nav("/sign-in", { replace: true });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Sign up failed");
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Sign up</h1>
        <p className="text-sm text-muted-foreground">Create your SaaSify account.</p>
      </div>

      <form
        className="space-y-3"
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
        <div className="space-y-1">
          <label className="text-sm">Name</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@saasify.dev"
            autoComplete="email"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            type="password"
            autoComplete="new-password"
          />
        </div>

        <button
          className="w-full border rounded px-3 py-2 text-sm"
          type="submit"
          disabled={register.isPending}
        >
          {register.isPending ? "Creating..." : "Create account"}
        </button>
      </form>

      <div className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="underline" to="/sign-in">
          Sign in
        </Link>
      </div>
    </div>
  );
}
