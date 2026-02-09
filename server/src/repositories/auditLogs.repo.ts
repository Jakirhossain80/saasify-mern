// FILE: server/src/repositories/auditLogs.repo.ts
import mongoose, { type ClientSession, type Types } from "mongoose";
import { connectDB } from "../db/connect";
import {
  AuditLog,
  type AuditLogDoc,
  type AuditAction,
  type AuditScope,
  type AuditTargetType,
} from "../models/AuditLog";

/**
 * =========================================
 * Shared helpers
 * =========================================
 */

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

// page/limit style pagination (Feature #5 listing)
function normalizePage(input: { page?: number; limit?: number }) {
  const page = Math.max(Number(input.page ?? 1) || 1, 1);
  const limit = Math.min(Math.max(Number(input.limit ?? 20) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * =========================================
 * ✅ EXISTING LISTING FUNCTIONS (keep working)
 * =========================================
 */

export async function listPlatformAuditLogs(p: Pagination = {}): Promise<AuditLogDoc[]> {
  await connectDB();
  const { limit, offset } = normalizePagination(p);

  return (await AuditLog.find({ scope: "platform" })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec()) as unknown as AuditLogDoc[];
}

export async function listTenantAuditLogs(
  tenantId: Types.ObjectId,
  p: Pagination = {}
): Promise<AuditLogDoc[]> {
  await connectDB();
  const { limit, offset } = normalizePagination(p);

  return (await AuditLog.find({ scope: "tenant", tenantId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec()) as unknown as AuditLogDoc[];
}

export async function listAuditLogsByActorUserId(
  actorUserId: Types.ObjectId,
  p: Pagination = {}
): Promise<AuditLogDoc[]> {
  await connectDB();
  const { limit, offset } = normalizePagination(p);

  return (await AuditLog.find({ actorUserId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec()) as unknown as AuditLogDoc[];
}

/**
 * =========================================
 * ✅ CREATE AUDIT LOG (Backward compatible)
 * =========================================
 */

export type CreateAuditLogInputOld = {
  scope: AuditScope;
  tenantId?: Types.ObjectId | null;
  actorUserId?: Types.ObjectId | null;

  action: string;

  entity: { type: string; id: string | Types.ObjectId };

  meta?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

export type CreateAuditLogInputNew = {
  actorUserId: Types.ObjectId;
  action: AuditAction | string;
  targetType: AuditTargetType | string;
  targetId: Types.ObjectId;
  tenantId?: Types.ObjectId | null;
  metadata?: Record<string, unknown>;
};

type CreateAuditLogInput = CreateAuditLogInputOld | CreateAuditLogInputNew;

export async function createAuditLogRepo(
  input: CreateAuditLogInputOld,
  session?: ClientSession
): Promise<AuditLogDoc>;
export async function createAuditLogRepo(
  input: CreateAuditLogInputNew,
  session?: ClientSession
): Promise<AuditLogDoc>;

export async function createAuditLogRepo(
  input: CreateAuditLogInput,
  session?: ClientSession
): Promise<AuditLogDoc> {
  await connectDB();

  const isOldStyle = (input as CreateAuditLogInputOld).entity !== undefined;

  const payload: any = {};

  if (isOldStyle) {
    const old = input as CreateAuditLogInputOld;

    payload.scope = old.scope;
    payload.action = old.action;

    payload.entity = {
      type: old.entity.type,
      id: typeof old.entity.id === "string" ? old.entity.id : String(old.entity.id),
    };

    // keep both for compatibility
    payload.meta = old.meta ?? {};
    payload.metadata = old.meta ?? {};

    if (old.tenantId && mongoose.isValidObjectId(String(old.tenantId))) payload.tenantId = old.tenantId;
    if (old.actorUserId && mongoose.isValidObjectId(String(old.actorUserId)))
      payload.actorUserId = old.actorUserId;

    if (typeof old.ip === "string") payload.ip = old.ip;
    if (typeof old.userAgent === "string") payload.userAgent = old.userAgent;
  } else {
    const n = input as CreateAuditLogInputNew;

    payload.scope = "platform";
    payload.actorUserId = n.actorUserId;
    payload.action = n.action;

    payload.targetType = n.targetType;
    payload.targetId = n.targetId;

    payload.metadata = n.metadata ?? {};
    payload.meta = n.metadata ?? {};

    payload.tenantId = n.tenantId ?? null;
  }

  const doc = new AuditLog(payload);
  await doc.save({ session });

  return doc as unknown as AuditLogDoc;
}

/**
 * ✅ IMPORTANT FIX:
 * Make sure `createAuditLog` is a REAL named export function
 * because older services import it as:
 *   import { createAuditLog } from "../repositories/auditLogs.repo";
 */
export async function createAuditLog(
  input: CreateAuditLogInputOld,
  session?: mongoose.ClientSession
): Promise<AuditLogDoc>;
export async function createAuditLog(
  input: CreateAuditLogInputNew,
  session?: mongoose.ClientSession
): Promise<AuditLogDoc>;
export async function createAuditLog(
  input: CreateAuditLogInputOld | CreateAuditLogInputNew,
  session?: mongoose.ClientSession
): Promise<AuditLogDoc> {
  return createAuditLogRepo(input as any, session);
}

/**
 * =========================================
 * ✅ Feature #5 — Paginated + Filtered listing
 * =========================================
 */

export type ListAuditLogsInput = {
  page?: number;
  limit?: number;
  filters?: {
    action?: string;
    tenantId?: Types.ObjectId;
    actorUserId?: Types.ObjectId;
    dateFrom?: Date;
    dateTo?: Date;
  };
};

export async function listAuditLogsRepo(input: ListAuditLogsInput): Promise<{
  items: Array<{
    id: string;
    action: string;
    actorUserId: string | null;
    tenantId: string | null;
    targetType: string | null;
    targetId: string | null;
    createdAt: Date;
    metadata: Record<string, unknown>;
    scope: "platform" | "tenant";
  }>;
  total: number;
  page: number;
  limit: number;
}> {
  await connectDB();

  const { page, limit, skip } = normalizePage({ page: input.page, limit: input.limit });
  const f = input.filters ?? {};

  const q: any = { scope: "platform" };

  if (f.action) q.action = f.action;
  if (f.tenantId) q.tenantId = f.tenantId;
  if (f.actorUserId) q.actorUserId = f.actorUserId;

  if (f.dateFrom || f.dateTo) {
    q.createdAt = {};
    if (f.dateFrom) q.createdAt.$gte = f.dateFrom;
    if (f.dateTo) q.createdAt.$lte = f.dateTo;
  }

  const [rows, total] = await Promise.all([
    AuditLog.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select({
        _id: 1,
        scope: 1,
        action: 1,
        actorUserId: 1,
        tenantId: 1,
        targetType: 1,
        targetId: 1,
        metadata: 1,
        entity: 1,
        meta: 1,
        createdAt: 1,
      })
      .lean()
      .exec(),
    AuditLog.countDocuments(q).exec(),
  ]);

  return {
    total,
    page,
    limit,
    items: rows.map((r: any) => ({
      id: String(r._id),
      scope: (r.scope ?? "platform") as "platform" | "tenant",
      action: String(r.action),
      actorUserId: r.actorUserId ? String(r.actorUserId) : null,
      tenantId: r.tenantId ? String(r.tenantId) : null,
      targetType: r.targetType ? String(r.targetType) : r.entity?.type ? String(r.entity.type) : null,
      targetId: r.targetId ? String(r.targetId) : r.entity?.id ? String(r.entity.id) : null,
      createdAt: r.createdAt,
      metadata: (r.metadata ?? r.meta ?? {}) as Record<string, unknown>,
    })),
  };
}
