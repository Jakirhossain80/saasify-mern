// FILE: server/src/services/tenants.service.ts
import type { Types } from "mongoose";
import type { TenantDoc } from "../models/Tenant";
import {
  getTenantByIdRepo,
  listTenantsRepo,
  setTenantSuspendedRepo,
  softDeleteTenantRepo,
} from "../repositories/tenants.repo";

/**
 * Platform-level: list tenants
 * Default excludes archived + deleted unless explicitly included.
 */
export async function listTenants(input: {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
  includeDeleted?: boolean;
}): Promise<TenantDoc[]> {
  return listTenantsRepo({
    limit: input.limit,
    offset: input.offset,
    includeArchived: input.includeArchived,
    includeDeleted: input.includeDeleted,
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
