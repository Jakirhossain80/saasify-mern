// FILE: client/src/pages/tenant/Invites.tsx
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PageShell from "../../components/common/PageShell";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";

type TenantMeResponse = {
  tenant: { id: string; slug: string };
  role: "tenantAdmin" | "member";
};

type InviteStatus = "pending" | "accepted" | "revoked" | "expired";
type InviteRole = "member" | "tenantAdmin";

/**
 * ✅ Align with your backend response shape
 * Backend returns: id, tenantId, email, role, status, expiresAt,
 * invitedByUserId, acceptedByUserId, createdAt, updatedAt
 *
 * We also keep _id as optional for backward compatibility if any older data exists.
 */
type InviteItem = {
  id: string; // ✅ backend uses `id`
  _id?: string; // ✅ optional legacy support

  tenantId: string;
  email: string;
  role: InviteRole;
  status: InviteStatus;

  expiresAt?: string | null;
  invitedByUserId?: string | null;
  acceptedByUserId?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
};

type ListInvitesResponse =
  | { items: InviteItem[] }
  | InviteItem[]; // keep both shapes safely

type CreateInviteBody = {
  email: string;
  role?: InviteRole;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function formatDate(input?: string | null) {
  if (!input) return "—";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function statusBadgeClass(status: InviteStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "accepted":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "revoked":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "expired":
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function roleBadgeClass(role: InviteRole) {
  return role === "tenantAdmin"
    ? "bg-slate-900 text-white border-slate-900"
    : "bg-slate-100 text-slate-800 border-slate-200";
}

function normalizeInvites(data: ListInvitesResponse | undefined): InviteItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray((data as any).items) ? (data as any).items : [];
}

function getInviteId(inv: InviteItem) {
  // ✅ Prefer backend `id`, fallback to `_id` if ever present
  return inv.id || inv._id || "";
}

function getInvitedByText(inv: InviteItem) {
  // ✅ Your backend provides invitedByUserId (string)
  return inv.invitedByUserId || "—";
}

export default function Invites() {
  const { tenantSlug = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  // 1) Resolve tenantId via /t/:tenantSlug/me
  const tenantMeQ = useQuery({
    queryKey: ["tenantMe", tenantSlug],
    queryFn: async () => {
      const { data } = await http.get<TenantMeResponse>(API.tenant.me(tenantSlug));
      return data;
    },
    enabled: !!tenantSlug,
  });

  const tenantId = tenantMeQ.data?.tenant.id;
  const isTenantAdmin = tenantMeQ.data?.role === "tenantAdmin";

  // 2) List invites via /tenant/:tenantId/invites
  const invitesQ = useQuery({
    queryKey: ["tenantInvites", tenantId],
    queryFn: async () => {
      const { data } = await http.get<ListInvitesResponse>(API.tenant.invites(tenantId!));
      return data;
    },
    enabled: !!tenantId,
    retry: 1,
  });

  const invites = useMemo(() => normalizeInvites(invitesQ.data), [invitesQ.data]);

  // Create form state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("member");

  const createInviteM = useMutation({
    mutationFn: async (body: CreateInviteBody) => {
      const { data } = await http.post(API.tenant.invites(tenantId!), body);
      return data;
    },
    onSuccess: async () => {
      toast.success("Invite created");
      setEmail("");
      setRole("member");
      await qc.invalidateQueries({ queryKey: ["tenantInvites", tenantId] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create invite";
      toast.error(msg);
    },
  });

  const revokeInviteM = useMutation({
    mutationFn: async (inviteId: string) => {
      const { data } = await http.delete(API.tenant.inviteById(tenantId!, inviteId));
      return data;
    },
    onSuccess: async () => {
      toast.success("Invite revoked");
      await qc.invalidateQueries({ queryKey: ["tenantInvites", tenantId] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to revoke invite";
      toast.error(msg);
    },
  });

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantId) return toast.error("Tenant not resolved yet.");
    if (!isTenantAdmin) return toast.error("Only tenantAdmin can create invites.");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return toast.error("Email is required.");
    if (!isValidEmail(cleanEmail)) return toast.error("Please enter a valid email.");

    createInviteM.mutate({ email: cleanEmail, role });
  };

  const onRefresh = () => invitesQ.refetch();

  // Tenant context loading
  if (tenantMeQ.isLoading) {
    return (
      <PageShell title="Invites" subtitle="Loading tenant context...">
        <div className="rounded-xl border p-4">Loading…</div>
      </PageShell>
    );
  }

  // Tenant context missing
  if (!tenantMeQ.data) {
    return (
      <PageShell title="Invites" subtitle="Tenant context not available">
        <div className="rounded-xl border p-4">
          Tenant context not found. Please go back and try again.
          <div className="mt-3">
            <button className="rounded-md border px-3 py-1" onClick={() => nav(-1)}>
              Back
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Invites"
      subtitle={`Invite users to tenant: ${tenantSlug}`}
      right={
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-3 py-1" onClick={() => nav(-1)}>
            Back
          </button>
          <button className="rounded-md border px-3 py-1" onClick={onRefresh}>
            Refresh
          </button>
        </div>
      }
    >
      {!isTenantAdmin && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
          You are <b>{tenantMeQ.data.role}</b>. Only <b>tenantAdmin</b> can use invites.
          <div className="mt-1 text-xs text-slate-600">
            Server RBAC also enforces this.
          </div>
        </div>
      )}

      {/* Create Invite Form */}
      <div className="mb-6 max-w-3xl rounded-2xl border bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Create invite</h2>
          <p className="text-sm text-slate-600">
            Create a new invite for this tenant. Default role is member.
          </p>
        </div>

        <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={!isTenantAdmin || createInviteM.isPending}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Role</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as InviteRole)}
              disabled={!isTenantAdmin || createInviteM.isPending}
            >
              <option value="member">member</option>
              <option value="tenantAdmin">tenantAdmin</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Creating tenantAdmin invites is powerful—use carefully.
            </p>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              className="rounded-md border bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
              disabled={!isTenantAdmin || createInviteM.isPending || !tenantId}
            >
              {createInviteM.isPending ? "Creating…" : "Create invite"}
            </button>

            <button
              type="button"
              className="rounded-md border px-4 py-2 disabled:opacity-50"
              onClick={() => {
                setEmail("");
                setRole("member");
              }}
              disabled={createInviteM.isPending}
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Invites List */}
      <div className="max-w-6xl rounded-2xl border bg-white p-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Invites list</h2>
            <p className="text-sm text-slate-600">
              Status: pending / accepted / revoked / expired
            </p>
          </div>
          <div className="text-xs text-slate-500">
            TenantId: <span className="font-mono">{tenantId ?? "—"}</span>
          </div>
        </div>

        {invitesQ.isLoading ? (
          <div className="rounded-xl border p-4">Loading invites…</div>
        ) : invitesQ.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm">
            Failed to load invites. Try Refresh.
          </div>
        ) : invites.length === 0 ? (
          <div className="rounded-xl border p-6 text-sm text-slate-600">
            No invites found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-[1050px] w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr className="border-b">
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3 font-semibold">Invited by</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {invites.map((inv) => {
                  const inviteId = getInviteId(inv);
                  const canRevoke = isTenantAdmin && inv.status === "pending" && !!inviteId;

                  return (
                    <tr key={inviteId || inv.email} className="border-b last:border-b-0">
                      <td className="px-4 py-3">{inv.email}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${roleBadgeClass(
                            inv.role
                          )}`}
                        >
                          {inv.role}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusBadgeClass(
                            inv.status
                          )}`}
                        >
                          {inv.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">{formatDate(inv.expiresAt)}</td>
                      <td className="px-4 py-3">{getInvitedByText(inv)}</td>
                      <td className="px-4 py-3">{formatDate(inv.createdAt)}</td>
                      <td className="px-4 py-3">{formatDate(inv.updatedAt)}</td>

                      <td className="px-4 py-3">
                        <button
                          className="rounded-md border px-3 py-1 disabled:opacity-50"
                          disabled={!canRevoke || revokeInviteM.isPending}
                          onClick={() => revokeInviteM.mutate(inviteId)}
                          title={
                            inv.status !== "pending"
                              ? "Only pending invites can be revoked"
                              : "Revoke invite"
                          }
                        >
                          {revokeInviteM.isPending ? "Working…" : "Revoke"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-4 py-3 text-xs text-slate-500">
              Note: Backend RBAC is the real security. UI gating is for UX only.
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
