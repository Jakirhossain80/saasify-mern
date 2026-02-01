// FILE: server/src/models/AuditLog.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export type AuditScope = "platform" | "tenant";

export type AuditAction =
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
  | "membership.role_changed";

export type AuditEntityType = "Tenant" | "Project" | "Invite" | "Membership" | "User";

const AuditLogSchema = new Schema(
  {
    scope: {
      type: String,
      required: true,
      enum: ["platform", "tenant"],
      index: true,
    },
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
    action: { type: String, required: true, index: true },

    entity: {
      type: { type: String, required: true }, // e.g. "Project", "Tenant", "Invite"
      id: { type: String, required: true },   // stringified ObjectId
    },

    meta: { type: Schema.Types.Mixed, default: {} }, // small payload, avoid PII
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ scope: 1, createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLog: Model<AuditLogDoc> =
  (mongoose.models.AuditLog as Model<AuditLogDoc>) ||
  mongoose.model<AuditLogDoc>("AuditLog", AuditLogSchema);
