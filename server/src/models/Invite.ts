// FILE: server/src/models/Invite.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";
export type TenantRole = "tenant_admin" | "member";

const InviteSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    role: { type: String, required: true, enum: ["tenant_admin", "member"], default: "member" },
    tokenHash: { type: String, required: true, index: true }, // store hash only
    status: {
      type: String,
      required: true,
      enum: ["pending", "accepted", "revoked", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

InviteSchema.index({ tenantId: 1, email: 1, status: 1 });
InviteSchema.index({ tenantId: 1, tokenHash: 1 }, { unique: true });

export type InviteDoc = InferSchemaType<typeof InviteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Invite: Model<InviteDoc> =
  (mongoose.models.Invite as Model<InviteDoc>) || mongoose.model<InviteDoc>("Invite", InviteSchema);
