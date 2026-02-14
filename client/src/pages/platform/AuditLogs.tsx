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

const ACTIONS = ["", "TENANT_CREATED", "TENANT_ARCHIVED", "TENANT_UNARCHIVED", "TENANT_ADMIN_ASSIGNED", "TENANT_DELETED"];

function formatTime(v: string | Date) {
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
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
        <p className="text-sm text-slate-600">Platform Admin only — monitor important platform actions.</p>

        {/* Filters */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-sm">Action</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
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

            <div className="space-y-1">
              <label className="text-sm">TenantId (optional)</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={tenantId}
                onChange={(e) => {
                  setPage(1);
                  setTenantId(e.target.value);
                }}
                placeholder='ObjectId("...")'
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">ActorUserId (optional)</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                value={actorUserId}
                onChange={(e) => {
                  setPage(1);
                  setActorUserId(e.target.value);
                }}
                placeholder='ObjectId("...")'
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">Limit</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
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

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="border rounded px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => logsQuery.refetch()}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* States */}
        {logsQuery.isLoading && <div className="border rounded-lg p-4 text-sm text-slate-600">Loading logs…</div>}

        {logsQuery.isError && (
          <div className="border rounded-lg p-4 space-y-1">
            <p className="text-sm font-medium text-rose-600">Failed to load audit logs.</p>
            <p className="text-sm text-slate-700">
              {(logsQuery.error as any)?.response?.data?.message || (logsQuery.error as any)?.message || "Unknown error"}
            </p>
          </div>
        )}

        {logsQuery.isSuccess && items.length === 0 && (
          <div className="border rounded-lg p-4 text-sm text-slate-600">No logs found</div>
        )}

        {logsQuery.isSuccess && items.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="p-3 border-b">Time</th>
                  <th className="p-3 border-b">Action</th>
                  <th className="p-3 border-b">Actor</th>
                  <th className="p-3 border-b">Tenant</th>
                  <th className="p-3 border-b">Target</th>
                </tr>
              </thead>

              <tbody>
                {items.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 border-b text-slate-600">{formatTime(log.createdAt)}</td>
                    <td className="p-3 border-b font-mono">{log.action}</td>
                    <td className="p-3 border-b font-mono">{log.actorUserId}</td>
                    <td className="p-3 border-b font-mono">{log.tenantId ?? "—"}</td>
                    <td className="p-3 border-b">
                      <div className="space-y-1">
                        <div className="font-mono">{log.targetType}</div>
                        <div className="font-mono text-slate-600">{log.targetId}</div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t p-3 flex items-center justify-between text-sm">
              <div className="text-slate-600">
                Page {page} of {totalPages} • Total {total}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="border rounded px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="border rounded px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
