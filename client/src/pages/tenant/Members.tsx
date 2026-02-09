// FILE: client/src/pages/tenant/Members.tsx
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";

type TenantMeResponse = {
  tenant: { id: string; slug: string };
  role: "tenantAdmin" | "member";
};

type MembershipItem = {
  _id?: string;
  id?: string;
  tenantId?: string;
  userId: string;
  role: "tenantAdmin" | "member";
  status: "active" | "removed";
  createdAt?: string;
  updatedAt?: string;
};

function getId(m: MembershipItem) {
  return m.id ?? m._id ?? `${m.userId}-${m.role}-${m.status}`;
}

function roleBadge(role: MembershipItem["role"]) {
  return role === "tenantAdmin"
    ? "bg-slate-900 text-white"
    : "bg-slate-100 text-slate-700 border border-slate-200";
}

export default function Members() {
  const { tenantSlug = "" } = useParams();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  // ✅ Use endpoint helper (baseURL already includes /api in http.ts)
  const meQ = useQuery({
    queryKey: ["tenantMe", tenantSlug],
    queryFn: async () => {
      const { data } = await http.get<TenantMeResponse>(API.tenant.me(tenantSlug));
      return data;
    },
    enabled: !!tenantSlug,
  });

  const tenantId = meQ.data?.tenant?.id ?? "";
  const isTenantAdmin = meQ.data?.role === "tenantAdmin";

  // ✅ Use endpoint helper
  const membersQ = useQuery({
    queryKey: ["tenantMembers", tenantId],
    queryFn: async () => {
      const { data } = await http.get<{ items: MembershipItem[] }>(
        API.tenant.members(tenantId)
      );
      return data.items ?? [];
    },
    enabled: !!tenantId && isTenantAdmin,
  });

  const activeItems = useMemo(() => {
    const items = membersQ.data ?? [];
    return items.filter((m) => m.status === "active");
  }, [membersQ.data]);

  const adminsCount = useMemo(() => {
    return activeItems.filter((m) => m.role === "tenantAdmin").length;
  }, [activeItems]);

  const filteredItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return activeItems;
    return activeItems.filter((m) => {
      return (
        m.userId.toLowerCase().includes(term) ||
        m.role.toLowerCase().includes(term) ||
        m.status.toLowerCase().includes(term)
      );
    });
  }, [activeItems, q]);

  const promoteDemoteM = useMutation({
    mutationFn: async (payload: { userId: string; role: "tenantAdmin" | "member" }) => {
      const { data } = await http.patch<{ membership: MembershipItem }>(
        API.tenant.memberByUser(tenantId, payload.userId),
        { role: payload.role }
      );
      return data.membership;
    },
    onSuccess: () => {
      toast.success("Member role updated");
      qc.invalidateQueries({ queryKey: ["tenantMembers", tenantId] });
      qc.invalidateQueries({ queryKey: ["tenantMe", tenantSlug] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update role");
    },
  });

  const removeM = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await http.delete<{ ok: boolean; userId: string; status: "removed" }>(
        API.tenant.memberByUser(tenantId, userId)
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: ["tenantMembers", tenantId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to remove member");
    },
  });

  const isBusy = promoteDemoteM.isPending || removeM.isPending;

  function handleRemove(userId: string, role: MembershipItem["role"]) {
    const msg =
      role === "tenantAdmin"
        ? "Remove this tenant admin from the tenant? (Soft remove)"
        : "Remove this member from the tenant? (Soft remove)";

    const ok = window.confirm(msg);
    if (!ok) return;
    removeM.mutate(userId);
  }

  function handleToggleRole(m: MembershipItem) {
    const nextRole: "tenantAdmin" | "member" = m.role === "member" ? "tenantAdmin" : "member";

    // Frontend hint only (backend is source of truth)
    if (m.role === "tenantAdmin" && nextRole === "member" && adminsCount <= 1) {
      toast.error("Cannot demote the last active tenantAdmin.");
      return;
    }

    promoteDemoteM.mutate({ userId: m.userId, role: nextRole });
  }

  if (meQ.isLoading) return <div className="p-6">Loading tenant context...</div>;

  if (meQ.isError) {
    const msg = (meQ.error as any)?.response?.data?.message ?? "Failed to load tenant context";
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Members / Team</h1>
          <p className="mt-2 text-sm text-rose-600">{msg}</p>
          <div className="mt-4">
            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
              onClick={() => meQ.refetch()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isTenantAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Members / Team</h1>
          <p className="mt-2 text-sm text-slate-600">
            You don’t have permission to manage members.
          </p>
          <div className="mt-4">
            <Link
              to={`/t/${tenantSlug}/dashboard`}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Members / Team</h1>
            <p className="text-sm text-slate-600">
              Tenant: <span className="font-medium">{tenantSlug}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
              to={`/t/${tenantSlug}/dashboard`}
            >
              Back
            </Link>

            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-60"
              onClick={() => membersQ.refetch()}
              disabled={!tenantId || membersQ.isFetching}
              title="Refresh members"
            >
              {membersQ.isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-4">
            <div className="text-xs text-slate-500">Active members</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {membersQ.isLoading ? "…" : activeItems.length}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="text-xs text-slate-500">Tenant admins</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {membersQ.isLoading ? "…" : adminsCount}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="text-xs text-slate-500">Search</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by userId / role"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Active members list</h2>
          <div className="text-xs text-slate-500">
            Actions are protected on the server (RBAC + last admin rules).
          </div>
        </div>

        {membersQ.isLoading && <div className="mt-4 text-sm">Loading members...</div>}

        {membersQ.isError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {(membersQ.error as any)?.response?.data?.message ?? "Failed to load members."}
          </div>
        )}

        {!membersQ.isLoading && !membersQ.isError && filteredItems.length === 0 && (
          <div className="mt-4 rounded-lg border p-4 text-sm text-slate-600">
            No active members found.
          </div>
        )}

        {!membersQ.isLoading && !membersQ.isError && filteredItems.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3">UserId</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((m) => (
                  <tr key={getId(m)} className="border-t">
                    <td className="p-3 font-mono text-xs">{m.userId}</td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${roleBadge(
                          m.role
                        )}`}
                      >
                        {m.role}
                      </span>
                    </td>

                    <td className="p-3">{m.status}</td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-60"
                          disabled={isBusy}
                          onClick={() => handleToggleRole(m)}
                          title="Promote/Demote"
                        >
                          {m.role === "member" ? "Promote to Admin" : "Demote to Member"}
                        </button>

                        <button
                          className="rounded-lg border px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                          disabled={isBusy}
                          onClick={() => handleRemove(m.userId, m.role)}
                          title="Soft remove (status=removed)"
                        >
                          Remove
                        </button>
                      </div>

                      {adminsCount <= 1 && m.role === "tenantAdmin" && (
                        <div className="mt-2 text-xs text-slate-500">
                          Last active admin protection is enabled.
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 text-xs text-slate-500">
              Note: Removing a member is a soft remove (status=&quot;removed&quot;). Backend blocks
              demoting/removing the last active tenantAdmin.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
