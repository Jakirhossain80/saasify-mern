// FILE: client/src/pages/tenant/AuditLogs.tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";
import PageShell from "../../components/common/PageShell";

type AuditLogItem = {
  id: string;
  action: string;
  actorUserId: string;
  tenantId: string | null;
  targetType: string;
  targetId: string;
  createdAt: string | Date;
  metadata: Record<string, unknown>;
};

type AuditLogsResponse = {
  items: AuditLogItem[];
  page: number;
  limit: number;
  total: number;
};

const ACTIONS = [
  "",
  "TENANT_CREATED",
  "TENANT_ARCHIVED",
  "TENANT_UNARCHIVED",
  "TENANT_ADMIN_ASSIGNED",
  "TENANT_DELETED",
];

function formatTime(v: string | Date) {
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function getActionBadgeClasses(action: string) {
  const a = action.toUpperCase();
  if (a.includes("DELETED") || a.includes("ARCHIVED")) {
    return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20";
  }
  if (a.includes("UNARCHIVED")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20";
  }
  if (a.includes("ASSIGNED") || a.includes("CREATED")) {
    return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20";
  }
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
}

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [action, setAction] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [actorUserId, setActorUserId] = useState("");

  const queryKey = useMemo(
    () => ["platformAuditLogs", page, limit, action, tenantId.trim(), actorUserId.trim()],
    [page, limit, action, tenantId, actorUserId]
  );

  const logsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await http.get<AuditLogsResponse>(API.platform.auditLogs, {
        params: {
          page,
          limit,
          action: action || undefined,
          tenantId: tenantId.trim() || undefined,
          actorUserId: actorUserId.trim() || undefined,
        },
      });
      return data;
    },
    keepPreviousData: true as any,
    staleTime: 0,
  });

  const data = logsQuery.data;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <PageShell title="Audit Logs">
      <div className="space-y-6">
        {/* Header helper line */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Platform Admin only — monitor important platform actions.
          </p>
          <span className="inline-flex w-fit items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            Platform Admin
          </span>
        </div>

        {/* Filters */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <svg
              className="h-5 w-5 text-slate-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Filters</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Action
                </label>
                <select
                  className="block w-full rounded-xl border-slate-200 bg-white py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/15"
                  value={action}
                  onChange={(e) => {
                    setPage(1);
                    setAction(e.target.value);
                  }}
                >
                  {ACTIONS.map((a) => (
                    <option key={a || "all"} value={a}>
                      {a ? a : "All actions"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tenant ID
                </label>
                <input
                  className="block w-full rounded-xl border-slate-200 bg-white py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-indigo-500/15"
                  value={tenantId}
                  onChange={(e) => {
                    setPage(1);
                    setTenantId(e.target.value);
                  }}
                  placeholder='ObjectId("...")'
                />
                <div className="text-xs text-slate-400 dark:text-slate-500">Optional • Mongo ObjectId</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Actor User ID
                </label>
                <input
                  className="block w-full rounded-xl border-slate-200 bg-white py-2.5 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-indigo-500/15"
                  value={actorUserId}
                  onChange={(e) => {
                    setPage(1);
                    setActorUserId(e.target.value);
                  }}
                  placeholder='ObjectId("...")'
                />
                <div className="text-xs text-slate-400 dark:text-slate-500">Optional • Mongo ObjectId</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Limit
                </label>
                <select
                  className="block w-full rounded-xl border-slate-200 bg-white py-2.5 text-sm text-slate-900 shadow-sm transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-500/15"
                  value={limit}
                  onChange={(e) => {
                    setPage(1);
                    setLimit(Number(e.target.value));
                  }}
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/30">
            <button
              type="button"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => logsQuery.refetch()}
            >
              Refresh
            </button>
          </div>
        </section>

        {/* States */}
        {logsQuery.isLoading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex space-x-2" aria-hidden="true">
                <div className="h-3 w-3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-3 animate-pulse rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="h-3 w-3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="w-full max-w-md space-y-3">
                <div className="mx-auto h-4 w-3/4 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
                <div className="mx-auto h-4 w-1/2 animate-pulse rounded-full bg-slate-50 dark:bg-slate-900/60" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading logs…</p>
            </div>
          </div>
        )}

        {logsQuery.isError && (
          <div className="flex items-start gap-4 rounded-2xl border border-slate-200 border-l-4 border-l-rose-500 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
              <svg
                className="h-6 w-6 text-rose-600 dark:text-rose-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">Failed to load audit logs.</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {(logsQuery.error as any)?.response?.data?.message ||
                  (logsQuery.error as any)?.message ||
                  "Unknown error"}
              </p>
            </div>
          </div>
        )}

        {logsQuery.isSuccess && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-950/40">
              <svg
                className="h-8 w-8 text-slate-300 dark:text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No logs found</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try adjusting filters or refresh to fetch the latest activity.
            </p>
          </div>
        )}

        {logsQuery.isSuccess && items.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Time
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Action
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Actor
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Tenant
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Target
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((log) => (
                    <tr
                      key={log.id}
                      className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4 align-top whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {formatTime(log.createdAt)}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <span
                          className={[
                            "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium font-mono",
                            getActionBadgeClasses(log.action),
                          ].join(" ")}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="font-mono text-slate-900 dark:text-slate-100">{log.actorUserId}</div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="font-mono text-slate-600 dark:text-slate-400">{log.tenantId ?? "—"}</div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="space-y-1">
                          <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">{log.targetType}</div>
                          <div className="font-mono text-slate-500 dark:text-slate-400">{log.targetId}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 text-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages} • Total {total}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}