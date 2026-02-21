// FILE: client/src/pages/tenant/SelectTenant.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore, type TenantRole } from "../../store/auth.store";
import { http } from "../../api/http";

/**
 * SelectTenant (slug-based)
 * - Keeps your existing UI + manual slug entry
 * - PRODUCTION fix:
 *   ✅ Do NOT auto-redirect away from /select-tenant even if activeTenantSlug exists.
 *   Instead show a "Continue to current tenant" button so user can switch tenant anytime.
 *
 * After user enters slug, we verify access + fetch role from backend:
 * GET /api/t/:tenantSlug/me
 *
 * Backend must run:
 * requireAuth → resolveTenant → requireTenantMembership → (this controller)
 * returns:
 * { tenant: { id, slug }, role: "tenantAdmin" | "member" }
 */
export default function SelectTenant() {
  const nav = useNavigate();

  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  const activeTenantSlug = useAuthStore((s) => s.activeTenantSlug);
  const setActiveTenantSlug = useAuthStore((s) => s.setActiveTenantSlug);
  const setActiveTenantRole = useAuthStore((s) => s.setActiveTenantRole);

  const [slug, setSlug] = useState(activeTenantSlug ?? "");
  const [isChecking, setIsChecking] = useState(false);

  // If platform admin, they should not use tenant selection
  useEffect(() => {
    if (user?.platformRole === "platformAdmin") {
      nav("/platform", { replace: true });
    }
  }, [user?.platformRole, nav]);

  // ✅ IMPORTANT FIX:
  // ❌ Removed the old auto-redirect:
  // useEffect(() => { if (activeTenantSlug) nav(`/t/${activeTenantSlug}/dashboard`, { replace: true }); }, ...)
  //
  // ✅ Now /select-tenant stays open as a "Switch tenant" page.
  // If activeTenantSlug exists, user can manually click "Continue to current tenant".

  const canContinue = useMemo(() => {
    // If you require Authorization header, accessToken must exist
    return slug.trim().length > 0 && !isChecking && !!accessToken;
  }, [slug, isChecking, accessToken]);

  async function fetchTenantContext(tenantSlug: string): Promise<{
    tenant: { id: string; slug: string };
    role: TenantRole;
  }> {
    // ✅ Your backend routes show tenant APIs under: /api/t/:tenantSlug/...
    // If http has baseURL="/api", this becomes /api/t/:tenantSlug/me
    const url = `/t/${tenantSlug}/me`;

    const { data } = await http.get<{
      tenant?: { id: string; slug: string };
      role?: TenantRole;
      membership?: { role?: TenantRole };
    }>(url, {
      // Your requireAuth expects Authorization: Bearer <token>
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Accept both shapes safely
    const role = (data?.role ?? data?.membership?.role ?? null) as TenantRole | null;
    const resolvedSlug = (data?.tenant?.slug ?? tenantSlug).trim().toLowerCase();

    if (role !== "tenantAdmin" && role !== "member") {
      throw new Error("Tenant role not found for this tenant.");
    }

    return {
      tenant: { id: String(data?.tenant?.id ?? ""), slug: resolvedSlug },
      role,
    };
  }

  const onContinue = async () => {
    const cleaned = slug.trim().toLowerCase();
    if (!cleaned) return;

    if (!accessToken) {
      toast.error("You are not signed in. Please sign in again.");
      nav("/sign-in", { replace: true });
      return;
    }

    setIsChecking(true);
    try {
      // ✅ 1) verify membership + get role from server
      const ctx = await fetchTenantContext(cleaned);

      // ✅ 2) persist tenant context in store
      setActiveTenantSlug(ctx.tenant.slug);
      setActiveTenantRole(ctx.role);

      // ✅ 3) persist slug for refresh survival (safe)
      localStorage.setItem("activeTenantSlug", ctx.tenant.slug);

      // ✅ 4) go to tenant dashboard
      nav(`/t/${ctx.tenant.slug}/dashboard`);
      toast.success(`Opened tenant: ${ctx.tenant.slug} (${ctx.role})`);
    } catch (err: any) {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;

      if (code === "TENANT_NOT_FOUND") toast.error("Tenant not found. Check the slug.");
      else if (code === "FORBIDDEN") toast.error("You do not have access to this tenant.");
      else toast.error(msg || "Could not access this tenant. Check slug and membership.");

      // keep store clean
      setActiveTenantSlug(null);
      setActiveTenantRole(null);
      localStorage.removeItem("activeTenantSlug");
    } finally {
      setIsChecking(false);
    }
  };

  const onContinueCurrentTenant = () => {
    if (!activeTenantSlug) return;
    nav(`/t/${activeTenantSlug}/dashboard`);
  };

  return (
    <div className="mx-auto max-w-xl py-10">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Select a tenant</h1>
          <p className="text-sm text-slate-600">
            Enter your tenant slug to open your tenant dashboard.
          </p>
        </div>

        {/* ✅ NEW: If a tenant is already selected, allow user to continue without redirecting */}
        {activeTenantSlug ? (
          <div className="mt-5 flex flex-col gap-2 rounded-xl border bg-slate-50 p-4">
            <div className="text-xs text-slate-600">
              Current tenant:{" "}
              <span className="font-semibold text-slate-900">{activeTenantSlug}</span>
            </div>

            <button
              type="button"
              onClick={onContinueCurrentTenant}
              className="inline-flex items-center justify-center rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Continue to current tenant
            </button>
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          <label className="text-sm font-medium">Tenant slug</label>
          <input
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder='Example: "acme"'
            autoComplete="off"
            disabled={isChecking}
          />
          <p className="text-xs text-slate-500">
            Example URL: <span className="font-medium">/t/acme/dashboard</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isChecking ? "Checking access..." : "Continue"} <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-4 rounded-lg border bg-slate-50 p-3 text-xs text-slate-600">
          If you don’t know your tenant slug, ask your Platform Admin or check your tenant name/slug in the Platform
          dashboard.
        </div>
      </div>
    </div>
  );
}
