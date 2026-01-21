// FILE: server/src/repositories/auditLogs.repo.ts
import type mongoose from "mongoose";
import { connectDB } from "../db/connect";
import {
  AuditLog,
  type AuditLogDoc,
  type AuditScope,
  type AuditAction,
} from "../models/AuditLog";

export type CreateAuditLogInput = {
  scope: AuditScope;
  tenantId?: mongoose.Types.ObjectId | null;
  actorUserId?: mongoose.Types.ObjectId | null;
  action: AuditAction;
  entity: { type: string; id: string };
  meta?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

export type ListAuditLogsOptions = {
  limit?: number;
  offset?: number;
};

export async function createAuditLog(input: CreateAuditLogInput): Promise<AuditLogDoc> {
  await connectDB();
  return AuditLog.create({
    scope: input.scope,
    tenantId: input.tenantId ?? null,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    entity: input.entity,
    meta: input.meta ?? {},
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  });
}

export async function listTenantAuditLogs(
  tenantId: mongoose.Types.ObjectId,
  opts: ListAuditLogsOptions = {}
): Promise<AuditLogDoc[]> {
  await connectDB();

  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  return AuditLog.find({ tenantId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
}

export async function listPlatformAuditLogs(
  opts: ListAuditLogsOptions = {}
): Promise<AuditLogDoc[]> {
  await connectDB();

  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  return AuditLog.find({ scope: "platform" })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
}
