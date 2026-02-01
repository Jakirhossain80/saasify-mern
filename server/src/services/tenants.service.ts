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
 * - Normalizes slug
 * - Checks duplicate slug
 * - Creates tenant
 * - Writes audit log: TENANT_CREATED
 * - Throws: SLUG_TAKEN
 */
export async function createTenant(input: {
  name: string;
  slug: string;
  logoUrl?: string;
  createdByUserId: Types.ObjectId;
}): Promise<TenantDoc> {
  const name = input.name.trim();
  const slug = normalizeSlug(input.slug);

  // ✅ explicit duplicate check (clean UX + clean API error)
  const existing = await findTenantBySlugRepo(slug);
  if (existing) throw new Error("SLUG_TAKEN");

  try {
    const created = await createTenantRepo({
      name,
      slug,
      logoUrl: input.logoUrl ?? "",
    });

    // ✅ audit log (best effort, but now real)
    // If AuditLog schema differs, this write may omit fields (strict mode).
    // Share models/AuditLog.ts if you want 100% aligned payload.
    await createAuditLog({
      action: "TENANT_CREATED",
      actorUserId: input.createdByUserId,
      tenantId: created._id,
      meta: { name: created.name, slug: created.slug },
    });

    return created;
  } catch (err: any) {
    // backup safety: if a race condition happens and unique index triggers
    if (err?.code === 11000) throw new Error("SLUG_TAKEN");
    throw err;
  }
}

/**
 * Platform-level: list tenants
 * Default excludes archived + deleted unless explicitly included.
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
 * Platform-level: get tenant details
 * Excludes soft-deleted tenants.
 */
export async function getTenantById(tenantId: Types.ObjectId): Promise<TenantDoc | null> {
  return getTenantByIdRepo(tenantId);
}

/**
 * Platform-level: suspend/unsuspend tenant
 * Suspension maps to isArchived to keep Phase-4 resolveTenant behavior consistent.
 */
export async function setTenantSuspended(input: {
  tenantId: Types.ObjectId;
  suspended: boolean;
}): Promise<TenantDoc | null> {
  return setTenantSuspendedRepo({
    tenantId: input.tenantId,
    suspended: input.suspended,
  });
}

/**
 * Platform-level: soft delete tenant
 * Sets deletedAt + deletedByUserId and archives tenant.
 */
export async function softDeleteTenant(input: {
  tenantId: Types.ObjectId;
  deletedByUserId: Types.ObjectId;
}): Promise<TenantDoc | null> {
  return softDeleteTenantRepo({
    tenantId: input.tenantId,
    deletedByUserId: input.deletedByUserId,
  });
}
