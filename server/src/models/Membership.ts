// FILE: server/src/models/Membership.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export type MembershipRole = "platform_admin" | "tenant_admin" | "member";

const MembershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    role: {
      type: String,
      enum: ["platform_admin", "tenant_admin", "member"],
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

MembershipSchema.index({ userId: 1, tenantId: 1 }, { unique: true });

export type MembershipDoc = InferSchemaType<typeof MembershipSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Membership: Model<MembershipDoc> =
  (mongoose.models.Membership as Model<MembershipDoc>) ||
  mongoose.model<MembershipDoc>("Membership", MembershipSchema);
