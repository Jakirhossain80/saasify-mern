 
 // FILE: server/src/repositories/auditLogs.repo.ts
import type { Types } from "mongoose";
import mongoose from "mongoose";
import { connectDB } from "../db/connect";
import { AuditLog, type AuditLogDoc } from "../models/AuditLog";

export type Pagination = {
  limit?: number;
  offset?: number;
};

// keep pagination strict + safe (prevents huge queries)
function normalizePagination(p?: Pagination) {
  const limit = Math.min(Math.max(p?.limit ?? 20, 1), 100);
  const offset = Math.max(p?.offset ?? 0, 0);
  return { limit, offset };
}

/**
 * PLATFORM scope audit logs
 * Returns newest first.
 *
 * Used by: services/auditLogs.service.ts -> getPlatformAuditLogs()
 * Must be exported with this exact name.
 */
export async function listPlatformAuditLogs(p: Pagination = {}): Promise<AuditLogDoc[]> {
  await connectDB();

  const { limit, offset } = normalizePagination(p);

  return AuditLog.find({ scope: "platform" })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec() as unknown as AuditLogDoc[];
}

/**
 * TENANT scope audit logs for a specific tenantId
 * Returns newest first.
 *
 * Used by: services/auditLogs.service.ts -> getTenantAuditLogs()
 * Must be exported with this exact name.
 */
export async function listTenantAuditLogs(
  tenantId: Types.ObjectId,
  p: Pagination = {}
): Promise<AuditLogDoc[]> {
  await connectDB();

  const { limit, offset } = normalizePagination(p);

  return AuditLog.find({ scope: "tenant", tenantId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec() as unknown as AuditLogDoc[];
}

/**
 * Optional helper (sometimes useful for platform UI)
 * - Lists audit logs for a specific actor across scopes.
 */
export async function listAuditLogsByActorUserId(
  actorUserId: Types.ObjectId,
  p: Pagination = {}
): Promise<AuditLogDoc[]> {
  await connectDB();

  const { limit, offset } = normalizePagination(p);

  return AuditLog.find({ actorUserId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec() as unknown as AuditLogDoc[];
}

/**
 * Create/write audit log entry.
 *
 * IMPORTANT:
 * Your AuditLog schema requires:
 * - scope
 * - action
 * - entity: { type, id }
 *
 * This repo expects the service to already format payload correctly.
 * It normalizes entity.id to string and removes undefined props.
 *
 * Export name is used by services/auditLogs.service.ts (createAuditLogRepo).
 */
export async function createAuditLogRepo(input: {
  scope: "platform" | "tenant";
  tenantId?: Types.ObjectId | null;
  actorUserId?: Types.ObjectId | null;

  action: string;

  entity: { type: string; id: string | Types.ObjectId };

  meta?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<AuditLogDoc> {
  await connectDB();

  const payload: any = {
    scope: input.scope,
    action: input.action,
    entity: {
      type: input.entity.type,
      id: typeof input.entity.id === "string" ? input.entity.id : String(input.entity.id),
    },
    meta: input.meta ?? {},
  };

  // Attach only if present & valid (avoid undefined + keep strict mode happy)
  if (input.tenantId && mongoose.isValidObjectId(String(input.tenantId))) {
    payload.tenantId = input.tenantId;
  }

  if (input.actorUserId && mongoose.isValidObjectId(String(input.actorUserId))) {
    payload.actorUserId = input.actorUserId;
  }

  if (typeof input.ip === "string") payload.ip = input.ip;
  if (typeof input.userAgent === "string") payload.userAgent = input.userAgent;

  const doc = await AuditLog.create(payload);
  // If you need lean docs, switch to doc.toObject() and cast.
  return doc as unknown as AuditLogDoc;
}
