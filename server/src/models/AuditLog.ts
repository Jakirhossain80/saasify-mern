// FILE: server/src/models/AuditLog.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * ✅ Backward-compatible AuditLog model (SAFE MERGE)
 *
 * Supports BOTH styles without breaking existing logs/data:
 *
 * OLD style (already used in your project):
 * - scope, action, entity { type, id }, meta, ip, userAgent
 *
 * NEW style (Feature #5 spec-friendly):
 * - actorUserId, action, targetType, targetId, tenantId?, metadata
 *
 * Key decisions:
 * - action is a plain string (indexed). NO enum in schema (prevents breaking dot-style actions).
 * - We keep BOTH meta + metadata and sync them.
 * - We keep BOTH entity + (targetType/targetId) and sync them best-effort.
 */

export type AuditScope = "platform" | "tenant";
export type AuditEntityType = "Tenant" | "Project" | "Invite" | "Membership" | "User" | "Other";

// ✅ Feature #5 target types (keep broad for compatibility)
export type AuditTargetType = "tenant" | "membership" | "project" | "invite" | "user" | "other";

// ✅ Combined action type (supports old + new + future)
export type AuditAction =
  // Platform actions (Feature #5)
  | "TENANT_CREATED"
  | "TENANT_ARCHIVED"
  | "TENANT_UNARCHIVED"
  | "TENANT_ADMIN_ASSIGNED"
  | "TENANT_DELETED"
  // Legacy dot-style actions (existing)
  | "tenant.created"
  | "tenant.status_changed"
  | "invite.created"
  | "invite.revoked"
  | "invite.accepted"
  | "project.created"
  | "project.updated"
  | "project.archived"
  | "project.restored"
  | "project.deleted"
  | "membership.role_changed"
  // Allow future additions without migrations
  | (string & {});

function toEntityType(targetType: AuditTargetType): AuditEntityType {
  switch (targetType) {
    case "tenant":
      return "Tenant";
    case "project":
      return "Project";
    case "invite":
      return "Invite";
    case "membership":
      return "Membership";
    case "user":
      return "User";
    default:
      return "Other";
  }
}

function toTargetType(entityType: unknown): AuditTargetType {
  const t = String(entityType || "");
  if (t === "Tenant") return "tenant";
  if (t === "Project") return "project";
  if (t === "Invite") return "invite";
  if (t === "Membership") return "membership";
  if (t === "User") return "user";
  return "other";
}

function isObjectIdString(val: unknown): val is string {
  return typeof val === "string" && mongoose.isValidObjectId(val);
}

const AuditLogSchema = new Schema(
  {
    // =========================
    // ✅ Legacy fields (KEEP)
    // =========================
    scope: {
      type: String,
      enum: ["platform", "tenant"],
      default: "platform",
      index: true,
    },

    entity: {
      type: {
        type: String,
        default: "Other",
      },
      id: {
        type: String,
        default: "",
      },
    },

    meta: { type: Schema.Types.Mixed, default: {} }, // legacy meta payload
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },

    // =========================
    // ✅ Shared fields
    // =========================
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },

    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ✅ Keep action as string (no enum) for backward compatibility
    action: {
      type: String,
      required: true,
      index: true,
    },

    // =========================
    // ✅ Feature #5 fields
    // =========================
    targetType: {
      type: String,
      enum: ["tenant", "membership", "project", "invite", "user", "other"],
      default: "other",
      index: true,
    },

    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

/**
 * ✅ Sync rules (VERY IMPORTANT for compatibility)
 * - meta <-> metadata sync
 * - entity <-> targetType/targetId sync (best-effort)
 * - scope inference (optional)
 */
AuditLogSchema.pre("validate", function (next) {
  try {
    const doc = this as any;

    // ---- meta <-> metadata (sync both ways)
    const hasMeta = doc.meta && Object.keys(doc.meta || {}).length > 0;
    const hasMetadata = doc.metadata && Object.keys(doc.metadata || {}).length > 0;

    if (hasMetadata && !hasMeta) doc.meta = doc.metadata;
    if (hasMeta && !hasMetadata) doc.metadata = doc.meta;

    // ---- new -> old (targetType/targetId -> entity)
    if (
      doc.targetType &&
      doc.targetId &&
      (!doc.entity || !doc.entity.type || !doc.entity.id)
    ) {
      doc.entity = doc.entity ?? {};
      doc.entity.type = toEntityType(doc.targetType);
      doc.entity.id = String(doc.targetId);
    }

    // ---- old -> new (entity -> targetType/targetId)
    if (doc.entity?.type && doc.entity?.id) {
      if (!doc.targetType || doc.targetType === "other") {
        doc.targetType = toTargetType(doc.entity.type);
      }

      if (!doc.targetId && isObjectIdString(doc.entity.id)) {
        doc.targetId = new mongoose.Types.ObjectId(doc.entity.id);
      }
    }

    // ---- scope inference (optional but helpful)
    if (!doc.scope) {
      doc.scope = doc.tenantId ? "tenant" : "platform";
    }

    next();
  } catch (e) {
    next(e as any);
  }
});

// ✅ Indexes for fast “latest first” listing + filters (Feature #5 + legacy)
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ scope: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ actorUserId: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, createdAt: -1 });
AuditLogSchema.index({ targetId: 1, createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLog: Model<AuditLogDoc> =
  (mongoose.models.AuditLog as Model<AuditLogDoc>) ||
  mongoose.model<AuditLogDoc>("AuditLog", AuditLogSchema);
