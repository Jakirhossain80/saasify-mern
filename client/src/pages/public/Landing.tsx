// FILE: client/src/pages/public/Landing.tsx
import { Link } from "react-router-dom";
import PageShell from "../../components/common/PageShell";
import { useAuthStore } from "../../store/auth.store";

export default function Landing() {
  const user = useAuthStore((s) => s.user);

  return (
    <PageShell title="Landing">
      <div className="space-y-3 text-sm">
        <p>Minimal Phase 7 client: routing + auth bootstrap + React Query wiring.</p>

        <div className="flex flex-wrap gap-2">
          {!user && (
            <Link className="border rounded px-3 py-1" to="/sign-in">
              Sign in
            </Link>
          )}

          <Link className="border rounded px-3 py-1" to="/platform">
            Platform
          </Link>

          <Link className="border rounded px-3 py-1" to="/t/tenant-a">
            Tenant A
          </Link>

          <Link className="border rounded px-3 py-1" to="/t/tenant-a/projects">
            Tenant A Projects
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
