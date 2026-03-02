// FILE: client/src/pages/tenant/Invites.tsx
import { useMemo, useState, type FormEvent } from "react";
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

function statusDotClass(status: InviteStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-500";
    case "accepted":
      return "bg-emerald-500";
    case "revoked":
      return "bg-slate-400";
    case "expired":
      return "bg-rose-500";
    default:
      return "bg-slate-400";
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
  if ("items" in data && Array.isArray(data.items)) return data.items;
  return [];
}

function getInviteId(inv: InviteItem) {
  // ✅ Prefer backend `id`, fallback to `_id` if ever present
  return inv.id || inv._id || "";
}

function getInvitedByText(inv: InviteItem) {
  // ✅ Your backend provides invitedByUserId (string)
  return inv.invitedByUserId || "—";
}

function getErrorMessage(err: unknown, fallback: string) {
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
  return fallback;
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
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to create invite"));
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
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to revoke invite"));
    },
  });

  const onCreate = (e: FormEvent<HTMLFormElement>) => {
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
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 w-44 rounded bg-slate-100" />
              <div className="h-3 w-64 rounded bg-slate-100" />
            </div>
          </div>
          <div className="mt-6 h-28 rounded-2xl bg-slate-50" />
        </div>
      </PageShell>
    );
  }

  // Tenant context missing
  if (!tenantMeQ.data) {
    return (
      <PageShell title="Invites" subtitle="Tenant context not available">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-700">
            Tenant context not found. Please go back and try again.
          </div>
          <div className="mt-4">
            <button
              className="inline-flex items-center rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={() => nav(-1)}
            >
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
          <button
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={onRefresh}
          >
            <span aria-hidden="true">↻</span>
            Refresh
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            onClick={() => nav(-1)}
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
        </div>
      }
    >
      {/* Role Warning Banner */}
      {!isTenantAdmin && (
        <div className="mb-8 flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <span aria-hidden="true">🛡️</span>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900">Permissions Notice</h4>
            <p className="mt-1 text-sm text-slate-700">
              You are currently logged in as{" "}
              <span className="font-bold text-amber-700">{tenantMeQ.data.role}</span>. Only
              users with the <span className="font-semibold">tenantAdmin</span> role are
              authorized to create or manage invites.
            </p>
            <div className="mt-1 text-xs text-slate-600">Server RBAC also enforces this.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Create Invite Form Card */}
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-900">Create invite</h2>
              <p className="mt-1 text-xs text-slate-500">
                Create a new invite for this tenant. Default role is member.
              </p>
            </div>

            <form onSubmit={onCreate} className="space-y-5 p-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={!isTenantAdmin || createInviteM.isPending}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Role</label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                  value={role}
                  onChange={(e) => setRole(e.target.value as InviteRole)}
                  disabled={!isTenantAdmin || createInviteM.isPending}
                >
                  <option value="member">member</option>
                  <option value="tenantAdmin">tenantAdmin</option>
                </select>
                <p className="text-xs text-slate-500">
                  Creating tenantAdmin invites is powerful—use carefully.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
                  disabled={!isTenantAdmin || createInviteM.isPending || !tenantId}
                >
                  <span aria-hidden="true">＋</span>
                  {createInviteM.isPending ? "Creating…" : "Create invite"}
                </button>

                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
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
        </div>

        {/* Invites List Card */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Invites list</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Status: pending / accepted / revoked / expired
                </p>
                <p className="mt-1 text-xs font-mono uppercase tracking-wider text-slate-500">
                  Tenant ID: {tenantId ?? "—"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  Total: {invites.length}
                </span>
              </div>
            </div>

            {invitesQ.isLoading ? (
              <div className="p-6">
                <div className="rounded-2xl border bg-slate-50 p-6 text-sm text-slate-600">
                  Loading invites…
                </div>
              </div>
            ) : invitesQ.isError ? (
              <div className="p-6">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                  Failed to load invites. Try Refresh.
                </div>
              </div>
            ) : invites.length === 0 ? (
              <div className="p-6">
                <div className="rounded-2xl border bg-white p-8 text-sm text-slate-600">
                  No invites found.
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-[1050px] w-full border-collapse text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr className="border-b">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Email
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                          Role
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Expires
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Invited by
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Created
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Updated
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {invites.map((inv) => {
                        const inviteId = getInviteId(inv);
                        const canRevoke =
                          isTenantAdmin && inv.status === "pending" && !!inviteId;

                        const mutedRow =
                          inv.status === "revoked" || inv.status === "expired";

                        return (
                          <tr
                            key={inviteId || inv.email}
                            className={[
                              "transition-colors hover:bg-slate-50/60",
                              mutedRow ? "opacity-70" : "",
                            ].join(" ")}
                          >
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900">
                                  {inv.email}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <span
                                className={[
                                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                  roleBadgeClass(inv.role),
                                ].join(" ")}
                              >
                                {inv.role}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <span
                                className={[
                                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                  statusBadgeClass(inv.status),
                                ].join(" ")}
                              >
                                <span
                                  className={[
                                    "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                                    statusDotClass(inv.status),
                                  ].join(" ")}
                                  aria-hidden="true"
                                />
                                {inv.status}
                              </span>
                            </td>

                            <td className="px-6 py-4">{formatDate(inv.expiresAt)}</td>
                            <td className="px-6 py-4">{getInvitedByText(inv)}</td>
                            <td className="px-6 py-4">{formatDate(inv.createdAt)}</td>
                            <td className="px-6 py-4">{formatDate(inv.updatedAt)}</td>

                            <td className="px-6 py-4 text-right">
                              <button
                                className="inline-flex items-center justify-center rounded-xl border bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
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
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                  <span className="text-xs text-slate-500">
                    Note: Backend RBAC is the real security. UI gating is for UX only.
                  </span>
                  <span className="text-xs text-slate-500">
                    Showing {invites.length} record{invites.length === 1 ? "" : "s"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}