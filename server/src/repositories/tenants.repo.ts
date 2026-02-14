// FILE: server/src/repositories/tenants.repo.ts
import mongoose, { type ClientSession, type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Tenant, type TenantDoc } from "../models/Tenant";

/**
 * ✅ Optional imports for "safe delete" checks.
 * We load these dynamically to avoid crashing the server
 * if Project/Membership models are not present yet.
 */
async function loadProjectModel(): Promise<any | null> {
  try {
    // If your project uses a different path/name, update here:
    const mod = await import("../models/Project");
    return (mod as any).Project ?? null;
  } catch {
    return null;
  }
}

async function loadMembershipModel(): Promise<any | null> {
  try {
    // If your project uses a different path/name, update here:
    const mod = await import("../models/Membership");
    return (mod as any).Membership ?? null;
  } catch {
    return null;
  }
}

export type ListTenantsRepoOptions = {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
  includeDeleted?: boolean;
  q?: string; // search by name/slug
};

export async function listTenantsRepo(
  options: ListTenantsRepoOptions = {}
): Promise<TenantDoc[]> {
  await connectDB();

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const filter: Record<string, unknown> = {};

  if (!options.includeArchived) filter.isArchived = false;
  if (!options.includeDeleted) filter.deletedAt = null;

  const q = (options.q ?? "").trim();
  if (q) {
    // escape user input so regex is safe
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { slug: rx }];
  }

  return Tenant.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).exec();
}

export async function findTenantBySlugRepo(slug: string): Promise<TenantDoc | null> {
  await connectDB();
  return Tenant.findOne({ slug: slug.trim().toLowerCase(), deletedAt: null }).exec();
}

/**
 * ✅ Read tenant by id
 * - Backward compatible with older code that passes Types.ObjectId
 * - Also supports passing string (newer services/controllers)
 * - Always respects soft-delete filter: deletedAt: null
 */
export async function getTenantByIdRepo(
  tenantId: Types.ObjectId | string
): Promise<TenantDoc | null> {
  await connectDB();

  const _id =
    typeof tenantId === "string" ? new mongoose.Types.ObjectId(tenantId) : tenantId;

  return Tenant.findOne({ _id, deletedAt: null }).exec();
}

export async function createTenantRepo(
  input: { name: string; slug: string; logoUrl?: string },
  session?: ClientSession
): Promise<TenantDoc> {
  await connectDB();

  const doc = new Tenant({
    name: input.name,
    slug: input.slug.trim().toLowerCase(),
    logoUrl: input.logoUrl ?? "",

    isArchived: false,

    // ✅ keep both archive metadata + soft-delete metadata compatible
    archivedAt: null,
    archivedByUserId: null,

    deletedAt: null,
    deletedByUserId: null,
  });

  await doc.save({ session });
  return doc;
}

/**
 * =========================
 * EXISTING FUNCTIONS (KEEP)
 * =========================
 * These are used by your current controllers/services.
 */

export async function setTenantSuspendedRepo(input: {
  tenantId: Types.ObjectId;
  suspended: boolean;
}): Promise<TenantDoc | null> {
  await connectDB();

  const existing = await Tenant.findOne({ _id: input.tenantId, deletedAt: null }).exec();
  if (!existing) return null;

  existing.isArchived = Boolean(input.suspended);

  // Optional: keep archive metadata in sync (safe)
  if (existing.isArchived) {
    (existing as any).archivedAt = (existing as any).archivedAt ?? new Date();
  } else {
    (existing as any).archivedAt = null;
    (existing as any).archivedByUserId = null;
  }

  await existing.save();
  return existing;
}

export async function softDeleteTenantRepo(input: {
  tenantId: Types.ObjectId;
  deletedByUserId: Types.ObjectId;
}): Promise<TenantDoc | null> {
  await connectDB();

  const existing = await Tenant.findOne({ _id: input.tenantId, deletedAt: null }).exec();
  if (!existing) return null;

  existing.deletedAt = new Date();
  existing.deletedByUserId = input.deletedByUserId as unknown as mongoose.Types.ObjectId;

  // soft delete also archives tenant
  existing.isArchived = true;

  // Optional: archive metadata
  (existing as any).archivedAt = (existing as any).archivedAt ?? new Date();

  await existing.save();
  return existing;
}

/**
 * =========================
 * NEW FUNCTIONS (ADD)
 * =========================
 */

/**
 * ✅ Tenant Settings Update (tenant-scoped)
 * - Uses $set
 * - Returns updated tenant
 * - Respects soft-delete filter (deletedAt: null)
 */
export async function updateTenantSettingsRepo(
  tenantId: Types.ObjectId | string,
  updates: { name?: string; logoUrl?: string; isArchived?: boolean }
): Promise<TenantDoc | null> {
  await connectDB();

  const _id =
    typeof tenantId === "string" ? new mongoose.Types.ObjectId(tenantId) : tenantId;

  return Tenant.findOneAndUpdate(
    { _id, deletedAt: null },
    { $set: updates },
    { new: true, runValidators: true }
  ).exec();
}

/**
 * ✅ Archive/Unarchive with metadata (recommended for Feature #2)
 * - If isArchived=true: set archivedAt + archivedByUserId
 * - If isArchived=false: clear archivedAt + archivedByUserId
 */
export async function setTenantArchivedRepo(input: {
  tenantId: Types.ObjectId;
  isArchived: boolean;
  archivedAt: Date | null;
  archivedByUserId: Types.ObjectId | null;
}): Promise<TenantDoc | null> {
  await connectDB();

  const existing = await Tenant.findOne({ _id: input.tenantId, deletedAt: null }).exec();
  if (!existing) return null;

  existing.isArchived = Boolean(input.isArchived);

  // These fields exist only if you added them in Tenant schema.
  // We assign safely so it won't crash if schema doesn't have them yet.
  (existing as any).archivedAt = input.archivedAt;
  (existing as any).archivedByUserId =
    input.archivedByUserId ? (input.archivedByUserId as unknown as mongoose.Types.ObjectId) : null;

  await existing.save();
  return existing;
}

/**
 * ✅ Safe hard delete (optional)
 * Only delete if tenant has NO projects and NO memberships.
 *
 * If Project/Membership models are missing, we return a safe error reason
 * instead of crashing the server.
 */
export async function safeDeleteTenantRepo(input: {
  tenantId: Types.ObjectId;
}): Promise<
  | { ok: true }
  | { ok: false; reason: "HAS_PROJECTS" | "HAS_MEMBERSHIPS" | "DEPENDENCY_MISSING" }
  | null
> {
  await connectDB();

  const existing = await Tenant.findOne({ _id: input.tenantId }).exec();
  if (!existing) return null;

  const Project = await loadProjectModel();
  const Membership = await loadMembershipModel();

  // If models are not ready yet, don't crash the server
  if (!Project || !Membership) {
    return { ok: false, reason: "DEPENDENCY_MISSING" };
  }

  const projectsCount = await Project.countDocuments({ tenantId: input.tenantId }).exec();
  if (projectsCount > 0) return { ok: false, reason: "HAS_PROJECTS" };

  const membershipsCount = await Membership.countDocuments({ tenantId: input.tenantId }).exec();
  if (membershipsCount > 0) return { ok: false, reason: "HAS_MEMBERSHIPS" };

  await Tenant.deleteOne({ _id: input.tenantId }).exec();
  return { ok: true };
}
