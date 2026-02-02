// FILE: server/src/services/tenants.service.ts
import type { Types } from "mongoose";
import type { TenantDoc } from "../models/Tenant";
import {
  createTenantRepo,
  findTenantBySlugRepo,
  getTenantByIdRepo,
  listTenantsRepo,
  setTenantSuspendedRepo,
  softDeleteTenantRepo,
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

    // ✅ AuditLog schema-aligned
    await createAuditLog({
      scope: "platform",
      action: "tenant.created",
      entity: { type: "Tenant", id: created._id },
      actorUserId: input.createdByUserId,
      tenantId: null, // platform scope event
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
 * ✅ FIX: Used by PATCH /api/platform/tenants/:tenantId/suspend
 * Suspension maps to isArchived via repo.
 */
export async function setTenantSuspended(input: {
  tenantId: Types.ObjectId;
  suspended: boolean;
}): Promise<TenantDoc | null> {
  const updated = await setTenantSuspendedRepo({
    tenantId: input.tenantId,
    suspended: input.suspended,
  });

  // Optional audit (safe + useful)
  if (updated) {
    await createAuditLog({
      scope: "platform",
      action: "tenant.status_changed",
      entity: { type: "Tenant", id: updated._id },
      actorUserId: null, // controller doesn't pass actor; keep null
      tenantId: null,
      meta: { suspended: Boolean(input.suspended), slug: updated.slug, name: updated.name },
    });
  }

  return updated;
}

/**
 * ✅ (Prevents next likely crash)
 * Used by DELETE /api/platform/tenants/:tenantId
 */
export async function softDeleteTenant(input: {
  tenantId: Types.ObjectId;
  deletedByUserId: Types.ObjectId;
}): Promise<TenantDoc | null> {
  const updated = await softDeleteTenantRepo({
    tenantId: input.tenantId,
    deletedByUserId: input.deletedByUserId,
  });

  // Optional audit
  if (updated) {
    await createAuditLog({
      scope: "platform",
      action: "tenant.status_changed",
      entity: { type: "Tenant", id: updated._id },
      actorUserId: input.deletedByUserId,
      tenantId: null,
      meta: { deletedAt: updated.deletedAt ?? null, slug: updated.slug, name: updated.name },
    });
  }

  return updated;
}
