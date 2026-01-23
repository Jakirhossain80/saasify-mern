// FILE: server/src/models/Membership.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export type MembershipRole = "platform_admin" | "tenant_admin" | "member";
export type MembershipStatus = "active" | "removed";

const membershipSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    role: {
      type: String,
      enum: ["platform_admin", "tenant_admin", "member"],
      required: true,
    },

    // ✅ Added for Phase-2 repo logic
    status: {
      type: String,
      enum: ["active", "removed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

// Optional but recommended: prevent duplicate membership per tenant/user
membershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

type MembershipSchema = InferSchemaType<typeof membershipSchema>;
export type MembershipDoc = mongoose.HydratedDocument<MembershipSchema>;

export const Membership: Model<MembershipSchema> =
  mongoose.models.Membership || mongoose.model("Membership", membershipSchema);
