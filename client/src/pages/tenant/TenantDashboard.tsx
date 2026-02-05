// FILE: client/src/pages/tenant/TenantDashboard.tsx
import { Link, useParams } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import RoleGate from "../../components/guards/RoleGate";

export default function TenantDashboard() {
  const { tenantSlug = "" } = useParams();
  const user = useAuthStore((s) => s.user);
  const activeTenantRole = useAuthStore((s) => s.activeTenantRole);

  const isTenantAdmin = activeTenantRole === "tenantAdmin";

  return (
    <div className="space-y-6">
      {/* ================= Header ================= */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Tenant Dashboard
            </h2>
            <p className="text-sm text-slate-600">
              Tenant: <span className="font-medium">{tenantSlug}</span>
              {" • "}
              Signed in as:{" "}
              <span className="font-medium">{user?.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="border rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50"
              to={`/t/${tenantSlug}/projects`}
            >
              View Projects
            </Link>

            {/* ✅ Tenant Admin only */}
            <RoleGate
              allowTenantRoles={["tenantAdmin"]}
              tenantDenyTo={`/t/${tenantSlug}/dashboard`}
            >
              <Link
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
                to={`/t/${tenantSlug}/projects?new=1`}
                title="Tenant Admin only"
              >
                + Create Project
              </Link>
            </RoleGate>
          </div>
        </div>
      </div>

      {/* ================= Overview Cards ================= */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-slate-500">Projects</div>
          <div className="mt-1 text-2xl font-semibold">—</div>
          <div className="mt-2 text-xs text-slate-500">
            Connect to stats API later
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-slate-500">Members</div>
          <div className="mt-1 text-2xl font-semibold">—</div>
          <div className="mt-2 text-xs text-slate-500">
            Connect to members API later
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="text-xs text-slate-500">Your role</div>
          <div className="mt-1 text-2xl font-semibold">
            {activeTenantRole ?? "—"}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Tenant-scoped role
          </div>
        </div>
      </div>

      {/* ================= Tenant Admin Panels ================= */}
      {isTenantAdmin ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold">Projects Management</h3>
            <p className="mt-1 text-sm text-slate-600">
              Create, update, and delete tenant projects.
            </p>
            <div className="mt-3">
              <Link
                className="border rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50"
                to={`/t/${tenantSlug}/projects`}
              >
                Manage Projects
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold">Members / Team</h3>
            <p className="mt-1 text-sm text-slate-600">
              View members, promote/remove members.
            </p>
            <div className="mt-3">
              <Link
                className="border rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50"
                to={`/t/${tenantSlug}/members`}
              >
                Open Members
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold">Invite Users</h3>
            <p className="mt-1 text-sm text-slate-600">
              Invite new users to this tenant.
            </p>
            <div className="mt-3">
              <Link
                className="border rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50"
                to={`/t/${tenantSlug}/invites`}
              >
                Invite Users
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="font-semibold">Tenant Analytics</h3>
            <p className="mt-1 text-sm text-slate-600">
              View tenant-level metrics.
            </p>
            <div className="mt-3">
              <Link
                className="border rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50"
                to={`/t/${tenantSlug}/analytics`}
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* ================= Member View ================= */
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Member View</h3>
          <p className="mt-1 text-sm text-slate-600">
            You are a tenant member. Admin panels (Members, Invites,
            Analytics, Settings) are hidden.
          </p>
        </div>
      )}

      {/* ================= Note ================= */}
      <div className="text-xs text-slate-500">
        Note: server enforces tenant membership and role. UI only
        hides/shows sections for better UX.
      </div>
    </div>
  );
}
