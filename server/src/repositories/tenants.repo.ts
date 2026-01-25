// FILE: server/src/repositories/tenants.repo.ts
import mongoose, { type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Tenant, type TenantDoc } from "../models/Tenant";

export type ListTenantsRepoOptions = {
  limit?: number;
  offset?: number;

  /**
   * Platform admins may want to include suspended tenants.
   * (Suspended is represented by isArchived=true to keep Phase-4 behavior.)
   */
  includeArchived?: boolean;

  /**
   * Platform admins may want to include soft-deleted tenants.
   * Soft-deleted tenants have deletedAt set.
   */
  includeDeleted?: boolean;
};

/**
 * Platform-level: list tenants (Phase 6 Module 1: Tenants).
 * Default excludes:
 * - archived (suspended) tenants
 * - soft-deleted tenants
 */
export async function listTenantsRepo(
  options: ListTenantsRepoOptions = {}
): Promise<TenantDoc[]> {
  await connectDB();

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const filter: Record<string, unknown> = {};

  // Default behavior: exclude archived and deleted unless explicitly requested
  if (!options.includeArchived) filter.isArchived = false;
  if (!options.includeDeleted) filter.deletedAt = null;

  return Tenant.find(filter)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
}

/**
 * Platform-level: view tenant details.
 * Default excludes soft-deleted tenants.
 */
export async function getTenantByIdRepo(
  tenantId: Types.ObjectId
): Promise<TenantDoc | null> {
  await connectDB();
  return Tenant.findOne({ _id: tenantId, deletedAt: null }).exec();
}

/**
 * Platform-level: suspend/unsuspend tenant.
 * Suspension maps to isArchived to keep resolveTenant behavior consistent (Phase 4).
 * If soft-deleted, treat as NOT_FOUND (return null).
 */
export async function setTenantSuspendedRepo(input: {
  tenantId: Types.ObjectId;
  suspended: boolean;
}): Promise<TenantDoc | null> {
  await connectDB();

  const existing = await Tenant.findOne({
    _id: input.tenantId,
    deletedAt: null,
  }).exec();

  if (!existing) return null;

  existing.isArchived = Boolean(input.suspended);
  await existing.save();
  return existing;
}

/**
 * Platform-level: soft delete tenant.
 * - Sets deletedAt + deletedByUserId
 * - Also sets isArchived=true so tenant becomes inactive (Phase 4 consistency)
 * If already soft-deleted, treat as NOT_FOUND (return null).
 */
export async function softDeleteTenantRepo(input: {
  tenantId: Types.ObjectId;
  deletedByUserId: Types.ObjectId;
}): Promise<TenantDoc | null> {
  await connectDB();

  const existing = await Tenant.findOne({
    _id: input.tenantId,
    deletedAt: null,
  }).exec();

  if (!existing) return null;

  existing.deletedAt = new Date();
  existing.deletedByUserId = input.deletedByUserId as unknown as mongoose.Types.ObjectId;
  existing.isArchived = true;

  await existing.save();
  return existing;
}
