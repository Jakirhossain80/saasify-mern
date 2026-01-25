// FILE: server/src/services/tenants.service.ts
import type { TenantDoc } from "../models/Tenant";
import { listTenantsRepo } from "../repositories/tenants.repo";

export async function listTenants(input: {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}): Promise<TenantDoc[]> {
  return listTenantsRepo({
    limit: input.limit,
    offset: input.offset,
    includeArchived: input.includeArchived,
  });
}
