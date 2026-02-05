// FILE: server/src/services/auditLogs.service.ts
import mongoose, { type Types } from "mongoose";
import type { AuditLogDoc, AuditScope, AuditAction } from "../models/AuditLog";
import * as repo from "../repositories/auditLogs.repo";
import { listAuditLogsRepo } from "../repositories/auditLogs.repo";

// helper to satisfy exactOptionalPropertyTypes (don't pass undefined props)
function cleanPagination(input?: { limit?: number; offset?: number }) {
  const opts: { limit?: number; offset?: number } = {};
  if (typeof input?.limit === "number") opts.limit = input.limit;
  if (typeof input?.offset === "number") opts.offset = input.offset;
  return opts;
}

/**
 * ✅ Existing service: tenant logs
 */
export async function getTenantAuditLogs(input: {
  tenantId: Types.ObjectId;
  limit?: number;
  offset?: number;
}): Promise<AuditLogDoc[]> {
  return repo.listTenantAuditLogs(input.tenantId, cleanPagination(input));
}

/**
 * ✅ Existing service: platform logs (simple list)
 */
export async function getPlatformAuditLogs(input?: {
  limit?: number;
  offset?: number;
}): Promise<AuditLogDoc[]> {
  return repo.listPlatformAuditLogs(cleanPagination(input));
}

/**
 * ✅ Existing service: create audit log (old style)
 * Used by older features that write: scope/action/entity/meta/ip/userAgent
 */
export async function createAuditLog(input: {
  scope: AuditScope;
  action: AuditAction | string;
  entity: { type: string; id: string | Types.ObjectId };

  actorUserId?: Types.ObjectId | null;
  tenantId?: Types.ObjectId | null;

  meta?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<AuditLogDoc> {
  // normalize entity.id to string (schema expects string for entity.id)
  const entityId = typeof input.entity.id === "string" ? input.entity.id : String(input.entity.id);

  // build payload without undefined fields
  const payload: any = {
    scope: input.scope,
    action: input.action,
    entity: {
      type: input.entity.type,
      id: entityId,
    },
    meta: input.meta ?? {},
    metadata: input.meta ?? {}, // keep synced
  };

  if (input.actorUserId && mongoose.isValidObjectId(String(input.actorUserId))) payload.actorUserId = input.actorUserId;
  if (input.tenantId && mongoose.isValidObjectId(String(input.tenantId))) payload.tenantId = input.tenantId;
  if (typeof input.ip === "string") payload.ip = input.ip;
  if (typeof input.userAgent === "string") payload.userAgent = input.userAgent;

  return repo.createAuditLogRepo(payload);
}

/**
 * ✅ Feature #5: Platform Audit Logs (pagination + filters)
 * Used by: GET /api/platform/audit-logs
 */
export async function listPlatformAuditLogsService(input: {
  page: number;
  limit: number;
  action?: string;
  tenantId?: string;
  actorUserId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const filters: {
    action?: string;
    tenantId?: Types.ObjectId;
    actorUserId?: Types.ObjectId;
    dateFrom?: Date;
    dateTo?: Date;
  } = {};

  if (input.action) filters.action = input.action;

  if (input.tenantId && mongoose.isValidObjectId(input.tenantId)) {
    filters.tenantId = new mongoose.Types.ObjectId(input.tenantId);
  }

  if (input.actorUserId && mongoose.isValidObjectId(input.actorUserId)) {
    filters.actorUserId = new mongoose.Types.ObjectId(input.actorUserId);
  }

  if (input.dateFrom) {
    const d = new Date(input.dateFrom);
    if (!Number.isNaN(d.getTime())) filters.dateFrom = d;
  }

  if (input.dateTo) {
    const d = new Date(input.dateTo);
    if (!Number.isNaN(d.getTime())) filters.dateTo = d;
  }

  const safePage = Math.max(input.page || 1, 1);
  const safeLimit = Math.min(Math.max(input.limit || 20, 1), 100);

  const { items, total } = await listAuditLogsRepo({
    page: safePage,
    limit: safeLimit,
    filters,
  });

  return {
    items,
    page: safePage,
    limit: safeLimit,
    total,
  };
}
