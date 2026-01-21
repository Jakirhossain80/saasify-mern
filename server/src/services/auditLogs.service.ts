// FILE: server/src/services/auditLogs.service.ts
import type mongoose from "mongoose";
import { listPlatformAuditLogs, listTenantAuditLogs } from "../repositories/auditLogs.repo";
import type { AuditLogDoc } from "../models/AuditLog";

export async function getTenantAuditLogs(input: {
  tenantId: mongoose.Types.ObjectId;
  limit?: number;
  offset?: number;
}): Promise<AuditLogDoc[]> {
  return listTenantAuditLogs(input.tenantId, { limit: input.limit, offset: input.offset });
}

export async function getPlatformAuditLogs(input?: {
  limit?: number;
  offset?: number;
}): Promise<AuditLogDoc[]> {
  return listPlatformAuditLogs({ limit: input?.limit, offset: input?.offset });
}
