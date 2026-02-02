// FILE: server/src/services/tenants.service.ts
import type { Types } from "mongoose";
import type { TenantDoc } from "../models/Tenant";
import {
  createTenantRepo,
  findTenantBySlugRepo,
  getTenantByIdRepo,
  listTenantsRepo,

  // existing repo funcs (your current controllers expect these service funcs to exist)
  setTenantSuspendedRepo,
  softDeleteTenantRepo,

  // new repo funcs (Feature #2)
  setTenantArchivedRepo,
  safeDeleteTenantRepo,
} from "../repositories/tenants.repo";
import { createAuditLog } from "./auditLogs.service";

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
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

    await createAuditLog({
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
    await createAuditLog({
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
 * ✅ Used by DELETE /api/platform/tenants/:tenantId (your current flow)
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
    await createAuditLog({
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

  await createAuditLog({
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
    await createAuditLog({
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
