// FILE: server/src/models/Membership.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export type MembershipRole = "tenantAdmin" | "member";
export type MembershipStatus = "active" | "removed";

const MembershipSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["tenantAdmin", "member"],
      required: true,
      index: true,
      default: "member",
    },
    status: {
      type: String,
      enum: ["active", "removed"],
      required: true,
      index: true,
      default: "active",
    },
  },
  { timestamps: true }
);

// ✅ UNIQUE { tenantId, userId }
MembershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

// ✅ index on { tenantId, role, status }
MembershipSchema.index({ tenantId: 1, role: 1, status: 1 });

export type MembershipDoc = InferSchemaType<typeof MembershipSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Membership: Model<MembershipDoc> =
  (mongoose.models.Membership as Model<MembershipDoc>) ||
  mongoose.model<MembershipDoc>("Membership", MembershipSchema);
