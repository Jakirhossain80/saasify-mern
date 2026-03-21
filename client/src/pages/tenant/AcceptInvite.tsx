// FILE: client/src/pages/tenant/AcceptInvite.tsx
import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";
import { useAuthStore, type TenantRole } from "../../store/auth.store";

type AcceptInviteResponse = {
  ok: true;
  role: TenantRole;
  membershipCreated: boolean;
};

function getErrorMessage(err: unknown): string {
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

  return "Failed to accept invite.";
}

export default function AcceptInvite() {
  const nav = useNavigate();
  const { tenantSlug = "" } = useParams();
  const [searchParams] = useSearchParams();

  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const setActiveTenantSlug = useAuthStore((s) => s.setActiveTenantSlug);
  const setActiveTenantRole = useAuthStore((s) => s.setActiveTenantRole);

  const hasTriggeredRef = useRef(false);

  const acceptInviteM = useMutation({
    mutationFn: async () => {
      const { data } = await http.post<AcceptInviteResponse>(API.tenant.acceptInvite(tenantSlug), {
        token,
      });
      return data;
    },
    onSuccess: (data) => {
      setActiveTenantSlug(tenantSlug);
      setActiveTenantRole(data.role);
      localStorage.setItem("activeTenantSlug", tenantSlug);

      toast.success(`Invite accepted. You now have ${data.role} access.`);
      nav(`/t/${tenantSlug}/dashboard`, { replace: true });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err));
    },
  });

  useEffect(() => {
    if (!tenantSlug || !token) return;
    if (hasTriggeredRef.current) return;

    hasTriggeredRef.current = true;
    acceptInviteM.mutate();
  }, [tenantSlug, token, acceptInviteM]);

  const canRetry = !!tenantSlug && !!token && !acceptInviteM.isPending;

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950">
      <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-lg items-center justify-center">
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-8 dark:border-slate-800">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Accept tenant invite
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Tenant: <span className="font-semibold">{tenantSlug || "—"}</span>
            </p>
          </div>

          <div className="space-y-5 p-8">
            {!token ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
                Invite token is missing. Please use the full invite link shared by the tenant admin.
              </div>
            ) : acceptInviteM.isPending ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Accepting your invite…
              </div>
            ) : acceptInviteM.isError ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
                  {getErrorMessage(acceptInviteM.error)}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => acceptInviteM.mutate()}
                    disabled={!canRetry}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    Retry
                  </button>

                  <button
                    type="button"
                    onClick={() => nav("/select-tenant", { replace: true })}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                  >
                    Go to Select Tenant
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                Invite accepted successfully. Redirecting to tenant dashboard…
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              This page is intentionally available before tenant membership is granted.
              After successful acceptance, your membership becomes active and tenant access will work normally.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}