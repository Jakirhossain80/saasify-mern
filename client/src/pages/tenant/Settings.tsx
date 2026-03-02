// FILE: client/src/pages/tenant/Settings.tsx
import { useEffect, useMemo, useState } from "react";
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

type TenantSettingsResponse = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    isArchived: boolean;
  };
};

type TenantSettingsUpdateBody = {
  name?: string;
  logoUrl?: string;
  isArchived?: boolean;
};

export default function Settings() {
  const { tenantSlug = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  // 1) Load tenant context (tenantId + role) using slug
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

  // 2) Load settings using tenantId (server requires tenantId)
  const settingsQ = useQuery({
    queryKey: ["tenantSettings", tenantId],
    queryFn: async () => {
      const { data } = await http.get<TenantSettingsResponse>(API.tenant.settings(tenantId!));
      return data;
    },
    enabled: !!tenantId,
  });

  const initial = settingsQ.data?.tenant;

  // Local form state
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [isArchived, setIsArchived] = useState(false);

  // Initialize form once when settings are loaded
  useEffect(() => {
    if (!initial) return;
    setName(initial.name ?? "");
    setLogoUrl(initial.logoUrl ?? "");
    setIsArchived(Boolean(initial.isArchived));
  }, [initial?.id]); // only re-init when tenant changes

  const canSubmit = Boolean(isTenantAdmin && tenantId);

  const updateM = useMutation({
    mutationFn: async (body: TenantSettingsUpdateBody) => {
      const { data } = await http.patch<TenantSettingsResponse>(
        API.tenant.settings(tenantId!),
        body
      );
      return data;
    },
    onSuccess: async () => {
      toast.success("Tenant settings updated");
      await qc.invalidateQueries({ queryKey: ["tenantSettings", tenantId] });
      await qc.invalidateQueries({ queryKey: ["tenantMe", tenantSlug] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: unknown } }; message?: unknown };
      const msg =
        (typeof e?.response?.data?.message === "string" && e.response.data.message) ||
        (typeof e?.message === "string" && e.message) ||
        "Failed to update tenant settings";
      toast.error(msg);
    },
  });

  const isDirty = useMemo(() => {
    if (!initial) return false;
    return (
      name.trim() !== (initial.name ?? "") ||
      logoUrl.trim() !== (initial.logoUrl ?? "") ||
      Boolean(isArchived) !== Boolean(initial.isArchived)
    );
  }, [initial, name, logoUrl, isArchived]);

  const onSave = () => {
    if (!canSubmit) return toast.error("Only tenantAdmin can update settings.");

    const body: TenantSettingsUpdateBody = {};

    // send only changed fields (clean + minimal)
    if (initial && name.trim() !== (initial.name ?? "")) body.name = name.trim();
    if (initial && logoUrl.trim() !== (initial.logoUrl ?? "")) body.logoUrl = logoUrl.trim();
    if (initial && Boolean(isArchived) !== Boolean(initial.isArchived)) body.isArchived = isArchived;

    if (Object.keys(body).length === 0) {
      return toast.info("No changes to save.");
    }

    updateM.mutate(body);
  };

  const onRefresh = () => settingsQ.refetch();

  // Loading tenant context
  if (tenantMeQ.isLoading) {
    return (
      <PageShell title="Tenant Settings" subtitle="Loading tenant context...">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            <div className="text-sm font-medium text-slate-600">Loading…</div>
          </div>
        </div>
      </PageShell>
    );
  }

  // No tenant context
  if (!tenantMeQ.data) {
    return (
      <PageShell title="Tenant Settings" subtitle="Tenant context not available">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-700">
            Tenant context not found. Please go back and try again.
          </div>
          <div className="mt-4">
            <button
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
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
      title="Tenant Settings"
      subtitle={`Tenant: ${tenantSlug}`}
      right={
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
            onClick={() => nav(-1)}
          >
            Back
          </button>
          <button
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
            onClick={onRefresh}
          >
            Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {!isTenantAdmin && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/60 text-amber-700 ring-1 ring-amber-200">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 8h.01M12 12v4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="font-bold text-amber-900">Administrator Access Only</div>
              <div className="text-amber-800/90">
                You are <b>{tenantMeQ.data.role}</b>. Only <b>tenantAdmin</b> can update settings.
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {settingsQ.isLoading ? (
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                  <div className="text-sm font-medium text-slate-600">Loading settings…</div>
                </div>
              </div>
            ) : settingsQ.isError ? (
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 text-rose-600 ring-1 ring-rose-200">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 9v4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 17h.01"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.29 3.86l-7.4 12.82A2 2 0 004.62 20h14.76a2 2 0 001.73-3.32l-7.4-12.82a2 2 0 00-3.42 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold">Failed to load settings</div>
                    <div className="text-sm opacity-90">Failed to load settings. Try Refresh.</div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Tenant Profile</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Update your organization's public information and branding.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Tenant name</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:opacity-60"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Acme"
                        disabled={!isTenantAdmin || updateM.isPending}
                      />
                      <p className="text-xs text-slate-500">
                        Min 2 characters. (Slug cannot be changed.)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Logo URL</label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:opacity-60"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        disabled={!isTenantAdmin || updateM.isPending}
                      />
                      <p className="text-xs text-slate-500">Must be a valid URL.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900">Tenant Status</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Manage the lifecycle and visibility of this tenant environment.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-slate-200 p-2 text-slate-700">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M21 8v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M22 3H2v5h20V3z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 12h4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      <div>
                        <div className="text-sm font-bold text-slate-900">Archive tenant</div>
                        <div className="text-xs text-slate-500">
                          When archived, backend blocks updates unless you unarchive.
                        </div>
                      </div>
                    </div>

                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={isArchived}
                        onChange={(e) => setIsArchived(e.target.checked)}
                        disabled={!isTenantAdmin || updateM.isPending}
                      />
                      <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 peer-disabled:opacity-60 peer-checked:bg-blue-600">
                        <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-slate-200 bg-white transition-transform peer-checked:translate-x-5" />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 p-6">
                  <button
                    className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
                    onClick={() => settingsQ.refetch()}
                    disabled={settingsQ.isLoading || updateM.isPending}
                  >
                    Reload
                  </button>

                  <button
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
                    onClick={onSave}
                    disabled={!canSubmit || updateM.isPending || !isDirty}
                  >
                    {updateM.isPending ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="mb-4 flex items-center gap-2 text-slate-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M16 18l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M21 12a9 9 0 11-9-9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                System Identifiers
              </h4>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">TenantId:</span>
                <span className="select-all font-semibold text-slate-900">{tenantId}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Slug:</span>
                <span className="select-all font-semibold text-slate-900">
                  {settingsQ.data?.tenant.slug}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current archived:</span>
                <span className="font-semibold text-slate-900">
                  {String(settingsQ.data?.tenant.isArchived)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
