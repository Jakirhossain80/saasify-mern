// FILE: server/src/services/tenants.service.ts
import mongoose, { type Types } from "mongoose";
import type { TenantDoc } from "../models/Tenant";
import {
  createTenantRepo,
  findTenantBySlugRepo,
  getTenantByIdRepo,
  listTenantsRepo,

  // existing repo funcs (your current controllers expect these service funcs to exist)
  setTenantSuspendedRepo,
  softDeleteTenantRepo,

  // feature #2 repo funcs
  setTenantArchivedRepo,
  safeDeleteTenantRepo,

  // ✅ tenant-scoped settings repo func (Module 4)
  updateTenantSettingsRepo,
} from "../repositories/tenants.repo";
import { createAuditLog } from "./auditLogs.service";

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

function httpError(status: number, message: string) {
  const err = new Error(message) as any;
  err.status = status;
  return err;
}

/**
 * ✅ CRITICAL FIX (final):
 * Audit logs must NEVER break the main business flow.
 * If audit log fails (schema mismatch, validation, etc),
 * we still return success for create/archive/delete actions.
 */
async function safeAudit(input: Parameters<typeof createAuditLog>[0]) {
  try {
    await createAuditLog(input as any);
  } catch (err) {
    // best-effort only — never throw
    // eslint-disable-next-line no-console
    console.warn("[audit] failed but ignored:", (err as any)?.message || err);
  }
}

/**
 * Platform-level: create tenant
 */
export async function createTenant(input: {
  name: string;
  slug: string;
  logoUrl?: string;
  createdByUserId: Types.ObjectId;
}): Promise<TenantDoc> {
  const name = input.name.trim();
  const slug = normalizeSlug(input.slug);

  const existing = await findTenantBySlugRepo(slug);
  if (existing) throw new Error("SLUG_TAKEN");

  try {
    const created = await createTenantRepo({
      name,
      slug,
      logoUrl: input.logoUrl ?? "",
    });

    // ✅ Do not let audit log failure cause 500
    await safeAudit({
      scope: "platform",
      action: "tenant.created",
      entity: { type: "Tenant", id: created._id },
      actorUserId: input.createdByUserId,
      tenantId: null,
      meta: { name: created.name, slug: created.slug },
    });

    return created;
  } catch (err: any) {
    if (err?.code === 11000) throw new Error("SLUG_TAKEN");
    throw err;
  }
}

/**
 * Platform-level: list tenants
 */
export async function listTenants(input: {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
  includeDeleted?: boolean;
  q?: string;
}): Promise<TenantDoc[]> {
  return listTenantsRepo({
    limit: input.limit,
    offset: input.offset,
    includeArchived: input.includeArchived,
    includeDeleted: input.includeDeleted,
    q: input.q,
  });
}

/**
 * Used by: GET /api/platform/tenants/:tenantId
 */
export async function getTenantById(tenantId: Types.ObjectId): Promise<TenantDoc | null> {
  return getTenantByIdRepo(tenantId);
}

/**
 * =========================================================
 * EXISTING EXPORTS (DO NOT REMOVE — your app imports these)
 * =========================================================
 *
 * ✅ Used by PATCH /api/platform/tenants/:tenantId/suspend
 * NOTE: In your repo, "suspend" maps to isArchived for now.
 */
export async function setTenantSuspended(input: {
  tenantId: Types.ObjectId;
  suspended: boolean;
  actorUserId?: Types.ObjectId | null; // optional so older controllers won't break
}): Promise<TenantDoc | null> {
  const updated = await setTenantSuspendedRepo({
    tenantId: input.tenantId,
    suspended: input.suspended,
  });

  if (updated) {
    // ✅ never break main flow
    await safeAudit({
      scope: "platform",
      action: "tenant.status_changed",
      entity: { type: "Tenant", id: updated._id },
      actorUserId: input.actorUserId ?? null,
      tenantId: null,
      meta: {
        suspended: Boolean(input.suspended),
        isArchived: Boolean(updated.isArchived),
        slug: updated.slug,
        name: updated.name,
      },
    });
  }

  return updated;
}

/**
 * ✅ Used by DELETE /api/platform/tenants/:tenantId/soft
 * This is "soft delete" (sets deletedAt + deletedByUserId, and archives).
 */
export async function softDeleteTenant(input: {
  tenantId: Types.ObjectId;
  deletedByUserId: Types.ObjectId;
}): Promise<TenantDoc | null> {
  const updated = await softDeleteTenantRepo({
    tenantId: input.tenantId,
    deletedByUserId: input.deletedByUserId,
  });

  if (updated) {
    // ✅ never break main flow
    await safeAudit({
      scope: "platform",
      action: "tenant.status_changed",
      entity: { type: "Tenant", id: updated._id },
      actorUserId: input.deletedByUserId,
      tenantId: null,
      meta: {
        deletedAt: updated.deletedAt ?? null,
        isArchived: Boolean(updated.isArchived),
        slug: updated.slug,
        name: updated.name,
      },
    });
  }

  return updated;
}

/**
 * ==========================================
 * FEATURE #2 EXPORTS (Archive / Unarchive)
 * ==========================================
 *
 * ✅ Prefer using this instead of "suspend" going forward.
 * - isArchived=true => archivedAt/new Date, archivedByUserId=actor
 * - isArchived=false => archivedAt=null, archivedByUserId=null
 */
export async function setTenantArchived(input: {
  tenantId: Types.ObjectId;
  isArchived: boolean;
  actorUserId: Types.ObjectId;
}): Promise<TenantDoc | null> {
  const tenant = await getTenantByIdRepo(input.tenantId);
  if (!tenant) return null;

  const archivedAt = input.isArchived ? new Date() : null;
  const archivedByUserId = input.isArchived ? input.actorUserId : null;

  const updated = await setTenantArchivedRepo({
    tenantId: input.tenantId,
    isArchived: input.isArchived,
    archivedAt,
    archivedByUserId,
  });

  if (!updated) return null;

  // ✅ never break main flow
  await safeAudit({
    scope: "platform",
    action: "tenant.status_changed",
    entity: { type: "Tenant", id: updated._id },
    actorUserId: input.actorUserId,
    tenantId: null,
    meta: {
      event: input.isArchived ? "TENANT_ARCHIVED" : "TENANT_UNARCHIVED",
      isArchived: Boolean(updated.isArchived),
      slug: updated.slug,
      name: updated.name,
    },
  });

  return updated;
}

/**
 * ==================================
 * FEATURE #2 EXPORTS (Safe Hard Delete)
 * ==================================
 *
 * ✅ Optional: hard delete ONLY if NO projects and NO memberships.
 * Repo may return DEPENDENCY_MISSING if Project/Membership models aren't ready.
 */
export async function safeDeleteTenant(input: {
  tenantId: Types.ObjectId;
  actorUserId: Types.ObjectId;
}): Promise<
  | { ok: true }
  | { ok: false; reason: "HAS_PROJECTS" | "HAS_MEMBERSHIPS" | "DEPENDENCY_MISSING" }
  | null
> {
  const result = await safeDeleteTenantRepo({ tenantId: input.tenantId });
  if (!result) return null;

  if (result.ok) {
    // ✅ never break main flow
    await safeAudit({
      scope: "platform",
      action: "tenant.status_changed",
      entity: { type: "Tenant", id: input.tenantId },
      actorUserId: input.actorUserId,
      tenantId: null,
      meta: { event: "TENANT_DELETED", deleted: true },
    });
  }

  return result;
}

/**
 * =========================================================
 * MODULE (4) — TENANT SETTINGS (tenant-scoped)
 * =========================================================
 *
 * ✅ Tenant Settings (GET)
 * Ensures tenant exists.
 */
export async function getTenantSettings(tenantId: string): Promise<TenantDoc> {
  if (!mongoose.isValidObjectId(tenantId)) throw httpError(400, "Invalid tenantId");

  const tenant = await getTenantByIdRepo(tenantId);
  if (!tenant) throw httpError(404, "Tenant not found");

  return tenant;
}

type TenantSettingsUpdate = {
  name?: string;
  logoUrl?: string;
  isArchived?: boolean;
};

/**
 * ✅ Tenant Settings (PATCH)
 * Business rules:
 * 1) Tenant must exist
 * 2) If tenant is archived -> reject updates (400) unless request is unarchiving (isArchived=false)
 * 3) Slug must never be updated (defensive strip)
 */
export async function updateTenantSettings(
  tenantId: string,
  updates: TenantSettingsUpdate
): Promise<TenantDoc> {
  if (!mongoose.isValidObjectId(tenantId)) throw httpError(400, "Invalid tenantId");

  const tenant = await getTenantByIdRepo(tenantId);
  if (!tenant) throw httpError(404, "Tenant not found");

  const isUnarchivingRequest = updates.isArchived === false;

  // Archived tenant update attempt -> 400 unless unarchiving
  if (tenant.isArchived && !isUnarchivingRequest) {
    throw httpError(400, "Tenant is archived. Unarchive first to update settings.");
  }

  // ✅ Defensive: never allow slug update even if someone tries (schema already blocks it)
  const { name, logoUrl, isArchived } = updates;
  const safeUpdates: TenantSettingsUpdate = {};
  if (typeof name === "string") safeUpdates.name = name;
  if (typeof logoUrl === "string") safeUpdates.logoUrl = logoUrl;
  if (typeof isArchived === "boolean") safeUpdates.isArchived = isArchived;

  const updated = await updateTenantSettingsRepo(tenantId, safeUpdates);
  if (!updated) throw httpError(404, "Tenant not found");

  return updated;
}
