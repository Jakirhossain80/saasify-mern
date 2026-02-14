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
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
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
        <div className="rounded-xl border p-4">Loading…</div>
      </PageShell>
    );
  }

  // No tenant context
  if (!tenantMeQ.data) {
    return (
      <PageShell title="Tenant Settings" subtitle="Tenant context not available">
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
      title="Tenant Settings"
      subtitle={`Tenant: ${tenantSlug}`}
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
          You are <b>{tenantMeQ.data.role}</b>. Only <b>tenantAdmin</b> can update settings.
        </div>
      )}

      <div className="max-w-3xl rounded-2xl border bg-white p-6">
        {settingsQ.isLoading ? (
          <div className="rounded-xl border p-4">Loading settings…</div>
        ) : settingsQ.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm">
            Failed to load settings. Try Refresh.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Tenant name</label>
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme"
                  disabled={!isTenantAdmin || updateM.isPending}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Min 2 characters. (Slug cannot be changed.)
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Logo URL</label>
                <input
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  disabled={!isTenantAdmin || updateM.isPending}
                />
                <p className="mt-1 text-xs text-slate-500">Must be a valid URL.</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border p-4">
              <div>
                <div className="font-medium">Archive tenant</div>
                <div className="text-xs text-slate-500">
                  When archived, backend blocks updates unless you unarchive.
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                  disabled={!isTenantAdmin || updateM.isPending}
                />
                Archived
              </label>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                className="rounded-md border bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                onClick={onSave}
                disabled={!canSubmit || updateM.isPending || !isDirty}
              >
                {updateM.isPending ? "Saving…" : "Save changes"}
              </button>

              <button
                className="rounded-md border px-4 py-2 disabled:opacity-50"
                onClick={() => settingsQ.refetch()}
                disabled={settingsQ.isLoading || updateM.isPending}
              >
                Reload
              </button>
            </div>

            <div className="mt-6 rounded-xl border bg-slate-50 p-4 text-xs">
              <div>
                <b>TenantId:</b> {tenantId}
              </div>
              <div>
                <b>Slug:</b> {settingsQ.data?.tenant.slug}
              </div>
              <div>
                <b>Current archived:</b> {String(settingsQ.data?.tenant.isArchived)}
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
