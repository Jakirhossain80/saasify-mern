// FILE: server/src/services/tenants.service.ts
import type { TenantDoc } from "../models/Tenant";
import { listTenants, updateTenantStatus } from "../repositories/tenants.repo";

export async function listTenantsForPlatform(opts?: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<{
  items: TenantDoc[];
  total: number;
  active: number;
  suspended: number;
  limit: number;
  offset: number;
}> {
  return listTenants(opts);
}

export async function setTenantStatus(
  tenantId: string,
  status: "active" | "suspended"
): Promise<TenantDoc | null> {
  return updateTenantStatus(tenantId, status);
}
