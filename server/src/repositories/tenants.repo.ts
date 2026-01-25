// FILE: server/src/repositories/tenants.repo.ts
import { connectDB } from "../db/connect";
import { Tenant, type TenantDoc } from "../models/Tenant";

export type ListTenantsRepoOptions = {
  limit?: number;
  offset?: number;
  includeArchived?: boolean; // platform admins may want this
};

/**
 * Platform-level: list tenants (Phase 5 platform routes).
 * Default excludes archived tenants unless explicitly requested.
 */
export async function listTenantsRepo(options: ListTenantsRepoOptions = {}): Promise<TenantDoc[]> {
  await connectDB();

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const filter: Record<string, unknown> = {};
  if (!options.includeArchived) {
    filter.isArchived = false;
  }

  return Tenant.find(filter)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
}
