// FILE: client/src/components/common/PageShell.tsx
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            SaaSify
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <span className="text-muted-foreground">{user.email}</span>
                <button
                  className="border rounded px-3 py-1"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link className="border rounded px-3 py-1" to="/sign-in">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-xl font-semibold mb-4">{title}</h1>
        {children}
      </main>
    </div>
  );
}
