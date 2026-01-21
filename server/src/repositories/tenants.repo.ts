// FILE: server/src/repositories/tenants.repo.ts
import { connectDB } from "../db/connect";
import { Tenant, type TenantDoc } from "../models/Tenant";

export type ListTenantsRepoOptions = {
  limit?: number;
  offset?: number;
  search?: string;
};

export async function listTenants(
  options: ListTenantsRepoOptions = {}
): Promise<{
  items: TenantDoc[];
  total: number;
  active: number;
  suspended: number;
  limit: number;
  offset: number;
}> {
  await connectDB();

  const limit = Math.min(Math.max(options.limit ?? 12, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const query: Record<string, unknown> = {};

  const search = options.search?.trim();
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
    ];
  }

  // NOTE:
  // Your old repo uses tenant.status = "active" | "suspended"
  // But your provided Tenant model currently has `isArchived` only.
  // To keep Phase-2 minimal and compiling, we won't assume status exists.
  // We'll count "active" as !isArchived, and "suspended" as isArchived.
  const [items, total, active, suspended] = await Promise.all([
    Tenant.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).exec(),
    Tenant.countDocuments(query).exec(),
    Tenant.countDocuments({ ...query, isArchived: false }).exec(),
    Tenant.countDocuments({ ...query, isArchived: true }).exec(),
  ]);

  return { items, total, active, suspended, limit, offset };
}

export async function updateTenantStatus(
  tenantId: string,
  status: "active" | "suspended"
): Promise<TenantDoc | null> {
  await connectDB();

  const isArchived = status === "suspended";

  return Tenant.findByIdAndUpdate(tenantId, { $set: { isArchived } }, { new: true }).exec();
}
