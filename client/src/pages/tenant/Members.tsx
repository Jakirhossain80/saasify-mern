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
    ? "bg-slate-900 text-white border border-slate-900"
    : "bg-slate-50 text-slate-700 border border-slate-200";
}

function statusBadge(status: MembershipItem["status"]) {
  return status === "active"
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-slate-50 text-slate-600 border border-slate-200";
}

function getErrorMessage(err: unknown, fallback: string) {
  if (!err) return fallback;

  if (typeof err === "string") return err;

  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    const response = e.response;

    if (response && typeof response === "object") {
      const r = response as Record<string, unknown>;
      const data = r.data;

      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        const message = d.message;
        if (typeof message === "string" && message.trim()) return message;
      }
    }

    const message = e.message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
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
      const { data } = await http.get<{ items: MembershipItem[] }>(API.tenant.members(tenantId));
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
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update role"));
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
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to remove member"));
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

  if (meQ.isLoading) {
    return (
      <div className="min-h-[60vh] bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-600">Loading tenant context...</div>
            <div className="mt-4 h-2 w-40 rounded-full bg-slate-100" />
            <div className="mt-2 h-2 w-64 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (meQ.isError) {
    const msg = getErrorMessage(meQ.error, "Failed to load tenant context");
    return (
      <div className="min-h-[60vh] bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">Members / Team</h1>
            <p className="mt-2 text-sm text-rose-600">{msg}</p>
            <div className="mt-4">
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                onClick={() => meQ.refetch()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isTenantAdmin) {
    return (
      <div className="min-h-[60vh] bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">Members / Team</h1>
            <p className="mt-2 text-sm text-slate-600">
              You don’t have permission to manage members.
            </p>
            <div className="mt-4">
              <Link
                to={`/t/${tenantSlug}/dashboard`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={`/t/${tenantSlug}/dashboard`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 shadow-sm transition-colors hover:bg-slate-900 hover:text-white"
                title="Back to Dashboard"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="h-5 w-5"
                >
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Members</h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="h-4 w-4"
                    >
                      <path
                        d="M3 21V5a2 2 0 012-2h10a2 2 0 012 2v16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 9h2a2 2 0 012 2v10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 7h6M7 11h6M7 15h6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Tenant: <span className="font-medium text-slate-900">{tenantSlug}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                onClick={() => membersQ.refetch()}
                disabled={!tenantId || membersQ.isFetching}
                title="Refresh members"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
                  <path
                    d="M20 12a8 8 0 10-3 6.245"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20 8v4h-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {membersQ.isFetching ? "Refreshing..." : "Refresh"}
              </button>

              <Link
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                to={`/t/${tenantSlug}/dashboard`}
                title="Back to Dashboard"
              >
                Back
              </Link>
            </div>
          </div>
        </header>

        {/* KPI & Search Section */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl bg-slate-900/10 p-3 text-slate-900">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
                <path
                  d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 11a4 4 0 100-8 4 4 0 000 8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23 21v-2a4 4 0 00-3-3.87"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3.13a4 4 0 010 7.75"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active members</p>
              <p className="mt-1 text-3xl font-bold leading-none text-slate-900">
                {membersQ.isLoading ? "…" : activeItems.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="rounded-2xl bg-slate-900/10 p-3 text-slate-900">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
                <path
                  d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tenant admins</p>
              <p className="mt-1 text-3xl font-bold leading-none text-slate-900">
                {membersQ.isLoading ? "…" : adminsCount}
              </p>
            </div>
          </div>

          <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <label className="block text-sm font-medium text-slate-500" htmlFor="members-search">
              Search
            </label>
            <input
              id="members-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by userId / role"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </div>

        {/* Members Table Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-200 bg-slate-50/60 px-6 py-5 sm:flex-row sm:items-center">
            <h2 className="text-lg font-bold text-slate-900">Active members list</h2>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              RBAC + last admin rules
            </span>
          </div>

          {membersQ.isLoading && (
            <div className="px-6 py-6">
              <div className="text-sm text-slate-600">Loading members...</div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-3/5 rounded-full bg-slate-100" />
                <div className="h-2 w-4/5 rounded-full bg-slate-100" />
                <div className="h-2 w-2/5 rounded-full bg-slate-100" />
              </div>
            </div>
          )}

          {membersQ.isError && (
            <div className="px-6 py-6">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {getErrorMessage(membersQ.error, "Failed to load members.")}
              </div>
            </div>
          )}

          {!membersQ.isLoading && !membersQ.isError && filteredItems.length === 0 && (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
                  <path
                    d="M21 21l-4.35-4.35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 11h6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-900">No active members found</p>
              <p className="mt-1 text-sm text-slate-600">
                Try adjusting your search to find what you&apos;re looking for.
              </p>
            </div>
          )}

          {!membersQ.isLoading && !membersQ.isError && filteredItems.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50/40 px-6 py-4">
                        Member
                      </th>
                      <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50/40 px-6 py-4">
                        Role
                      </th>
                      <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50/40 px-6 py-4">
                        Status
                      </th>
                      <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50/40 px-6 py-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((m) => (
                      <tr
                        key={getId(m)}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/10 text-sm font-bold text-slate-900">
                              {m.userId.trim().slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                {m.userId}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                User ID:{" "}
                                <span className="font-mono text-[11px] text-slate-600">
                                  {m.userId}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadge(
                              m.role
                            )}`}
                          >
                            {m.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(
                              m.status
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                m.status === "active" ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                            {m.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                                disabled={isBusy}
                                onClick={() => handleToggleRole(m)}
                                title="Promote/Demote"
                              >
                                {m.role === "member" ? "Promote to Admin" : "Demote to Member"}
                              </button>

                              <button
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition-colors hover:bg-rose-100 disabled:opacity-60"
                                disabled={isBusy}
                                onClick={() => handleRemove(m.userId, m.role)}
                                title="Soft remove (status=removed)"
                              >
                                Remove
                              </button>
                            </div>
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
              </div>

              <div className="border-t border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-500">
                Note: Removing a member is a soft remove (status=&quot;removed&quot;). Backend
                blocks demoting/removing the last active tenantAdmin.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
