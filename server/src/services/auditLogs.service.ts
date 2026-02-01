// FILE: server/src/services/auditLogs.service.ts
import type { Types } from "mongoose";
import mongoose from "mongoose";
import { AuditLog, type AuditLogDoc, type AuditScope, type AuditAction } from "../models/AuditLog";
import * as repo from "../repositories/auditLogs.repo";

// helper to satisfy exactOptionalPropertyTypes (don't pass undefined props)
function cleanPagination(input?: { limit?: number; offset?: number }) {
  const opts: { limit?: number; offset?: number } = {};
  if (typeof input?.limit === "number") opts.limit = input.limit;
  if (typeof input?.offset === "number") opts.offset = input.offset;
  return opts;
}

// ✅ Find the correct repo functions without crashing the app.
// Your repo might use slightly different names — we support common variants.
function getListTenantFn(): (
  tenantId: Types.ObjectId,
  p: { limit?: number; offset?: number }
) => Promise<AuditLogDoc[]> {
  const fn: any =
    (repo as any).listTenantAuditLogs ||
    (repo as any).listTenantAuditLogsRepo ||
    (repo as any).getTenantAuditLogsRepo ||
    (repo as any).findTenantAuditLogsRepo;

  if (typeof fn !== "function") {
    throw new Error(
      "AUDIT_REPO_MISSING_LIST_TENANT: Expected a tenant audit log list function in repositories/auditLogs.repo.ts"
    );
  }
  return fn;
}

function getListPlatformFn(): (p: { limit?: number; offset?: number }) => Promise<AuditLogDoc[]> {
  const fn: any =
    (repo as any).listPlatformAuditLogs ||
    (repo as any).listPlatformAuditLogsRepo ||
    (repo as any).getPlatformAuditLogsRepo ||
    (repo as any).findPlatformAuditLogsRepo;

  if (typeof fn !== "function") {
    throw new Error(
      "AUDIT_REPO_MISSING_LIST_PLATFORM: Expected a platform audit log list function in repositories/auditLogs.repo.ts"
    );
  }
  return fn;
}

function getCreateFn(): ((payload: any) => Promise<AuditLogDoc>) | null {
  const fn: any =
    (repo as any).createAuditLogRepo ||
    (repo as any).insertAuditLogRepo ||
    (repo as any).writeAuditLogRepo ||
    (repo as any).logAuditEventRepo;

  return typeof fn === "function" ? fn : null;
}

export async function getTenantAuditLogs(input: {
  tenantId: Types.ObjectId;
  limit?: number;
  offset?: number;
}): Promise<AuditLogDoc[]> {
  const listTenant = getListTenantFn();
  return listTenant(input.tenantId, cleanPagination(input));
}

export async function getPlatformAuditLogs(input?: {
  limit?: number;
  offset?: number;
}): Promise<AuditLogDoc[]> {
  const listPlatform = getListPlatformFn();
  return listPlatform(cleanPagination(input));
}

/**
 * ✅ Create audit log (schema-aligned)
 * Required by schema:
 * - scope
 * - action
 * - entity: { type, id }
 *
 * Optional:
 * - tenantId (for tenant scope)
 * - actorUserId
 * - meta
 * - ip
 * - userAgent
 */
export async function createAuditLog(input: {
  scope: AuditScope;
  action: AuditAction | string; // allow string for flexibility, but prefer AuditAction
  entity: { type: string; id: string | Types.ObjectId };

  actorUserId?: Types.ObjectId | null;
  tenantId?: Types.ObjectId | null;

  meta?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<AuditLogDoc> {
  // ✅ normalize entity.id to string (schema requires string)
  const entityId =
    typeof input.entity.id === "string"
      ? input.entity.id
      : String(input.entity.id);

  // ✅ build payload without undefined fields
  const payload: any = {
    scope: input.scope,
    action: input.action,
    entity: {
      type: input.entity.type,
      id: entityId,
    },
    meta: input.meta ?? {},
  };

  if (input.actorUserId && mongoose.isValidObjectId(String(input.actorUserId))) {
    payload.actorUserId = input.actorUserId;
  }

  // tenantId is allowed to be null, but only attach if provided
  if (input.tenantId && mongoose.isValidObjectId(String(input.tenantId))) {
    payload.tenantId = input.tenantId;
  }

  if (typeof input.ip === "string") payload.ip = input.ip;
  if (typeof input.userAgent === "string") payload.userAgent = input.userAgent;

  // Prefer repo create if it exists (keeps architecture consistent)
  const repoCreate = getCreateFn();
  if (repoCreate) {
    return repoCreate(payload);
  }

  // fallback: direct model write (still safe)
  const doc = await AuditLog.create(payload);
  return doc as AuditLogDoc;
}
