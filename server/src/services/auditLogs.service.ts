// FILE: server/src/services/auditLogs.service.ts
import type { Types } from "mongoose";
import {
  listPlatformAuditLogs,
  listTenantAuditLogs,
} from "../repositories/auditLogs.repo";
import type { AuditLogDoc } from "../models/AuditLog";

// helper to satisfy exactOptionalPropertyTypes (don't pass undefined props)
function cleanPagination(input?: { limit?: number; offset?: number }) {
  const opts: { limit?: number; offset?: number } = {};
  if (typeof input?.limit === "number") opts.limit = input.limit;
  if (typeof input?.offset === "number") opts.offset = input.offset;
  return opts;
}

export async function getTenantAuditLogs(input: {
  tenantId: Types.ObjectId;
  limit?: number;
  offset?: number;
}): Promise<AuditLogDoc[]> {
  return listTenantAuditLogs(input.tenantId, cleanPagination(input));
}

export async function getPlatformAuditLogs(input?: {
  limit?: number;
  offset?: number;
}): Promise<AuditLogDoc[]> {
  return listPlatformAuditLogs(cleanPagination(input));
}
