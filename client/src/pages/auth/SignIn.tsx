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

  useEffect(() => {
    // If already logged in (for example after a manual redirect), go back
    if (isBootstrapped && user) nav(from || "/", { replace: true });
  }, [user, nav, from, isBootstrapped]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Use your SaaSify-MERN credentials.</p>
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate({ email: email.trim().toLowerCase(), password });
        }}
      >
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
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
          />
        </div>

        <button
          className="w-full border rounded px-3 py-2 text-sm"
          type="submit"
          disabled={login.isPending}
        >
          {login.isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
