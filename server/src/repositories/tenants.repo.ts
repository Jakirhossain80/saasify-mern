// FILE: server/src/repositories/tenants.repo.ts
import mongoose, { type ClientSession, type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Tenant, type TenantDoc } from "../models/Tenant";

export type ListTenantsRepoOptions = {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
  includeDeleted?: boolean;
  q?: string; // ✅ add: simple search by name/slug
};

export async function listTenantsRepo(options: ListTenantsRepoOptions = {}): Promise<TenantDoc[]> {
  await connectDB();

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const filter: Record<string, unknown> = {};

  if (!options.includeArchived) filter.isArchived = false;
  if (!options.includeDeleted) filter.deletedAt = null;

  const q = (options.q ?? "").trim();
  if (q) {
    // ✅ basic search: name or slug contains q (case-insensitive)
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { slug: rx }];
  }

  return Tenant.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).exec();
}

export async function findTenantBySlugRepo(slug: string): Promise<TenantDoc | null> {
  await connectDB();
  return Tenant.findOne({ slug: slug.trim().toLowerCase(), deletedAt: null }).exec();
}

export async function getTenantByIdRepo(tenantId: Types.ObjectId): Promise<TenantDoc | null> {
  await connectDB();
  return Tenant.findOne({ _id: tenantId, deletedAt: null }).exec();
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
    deletedAt: null,
    deletedByUserId: null,
  });

  await doc.save({ session });
  return doc;
}

export async function setTenantSuspendedRepo(input: {
  tenantId: Types.ObjectId;
  suspended: boolean;
}): Promise<TenantDoc | null> {
  await connectDB();

  const existing = await Tenant.findOne({ _id: input.tenantId, deletedAt: null }).exec();
  if (!existing) return null;

  existing.isArchived = Boolean(input.suspended);
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
  existing.isArchived = true;

  await existing.save();
  return existing;
}
