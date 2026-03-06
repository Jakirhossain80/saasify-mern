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

function getErrorMessage(err: unknown): { code?: string; message: string } {
  if (typeof err === "object" && err !== null) {
    const e = err as {
      message?: unknown;
      response?: { data?: { code?: unknown; message?: unknown } };
    };

    const codeRaw = e.response?.data?.code;
    const msgRaw = e.response?.data?.message;

    const code = typeof codeRaw === "string" ? codeRaw : undefined;
    const message =
      (typeof msgRaw === "string" && msgRaw.trim()) ||
      (typeof e.message === "string" && e.message.trim()) ||
      "Could not access this tenant. Check slug and membership.";

    return { code, message };
  }

  return { message: "Could not access this tenant. Check slug and membership." };
}

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
    } catch (err: unknown) {
      const parsed = getErrorMessage(err);

      if (parsed.code === "TENANT_NOT_FOUND") toast.error("Tenant not found. Check the slug.");
      else if (parsed.code === "FORBIDDEN") toast.error("You do not have access to this tenant.");
      else toast.error(parsed.message);

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
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-950">
      <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <header className="p-8 pb-0 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Select a tenant
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Enter your tenant slug to open your tenant dashboard.
            </p>
          </header>

          <div className="space-y-6 p-8">
            {/* ✅ NEW: If a tenant is already selected, allow user to continue without redirecting */}
            {activeTenantSlug ? (
              <div className="space-y-3">
                <div className="rounded-r-md border-l-4 border-blue-600 bg-blue-50 p-4 dark:bg-blue-500/10">
                  <div className="flex items-center">
                    <svg
                      className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Current tenant:{" "}
                      <span className="font-bold">{activeTenantSlug}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onContinueCurrentTenant}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-950 dark:focus:ring-slate-800"
                >
                  Continue to current tenant
                </button>

                <div className="relative">
                  <div aria-hidden="true" className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 font-medium tracking-wider text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                      or switch tenant
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Tenant slug</label>
              <input
                className="block w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-blue-500/20"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder='Example: "acme"'
                autoComplete="off"
                disabled={isChecking}
              />
              <p className="text-xs italic text-slate-500 dark:text-slate-400">
                Example URL: <span className="font-mono">/t/acme/dashboard</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onContinue}
              disabled={!canContinue}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isChecking ? "Checking access..." : "Continue"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex">
                <svg
                  className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  />
                </svg>
                <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  If you don’t know your tenant slug, ask your Platform Admin or check your
                  tenant name/slug in the Platform dashboard.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
