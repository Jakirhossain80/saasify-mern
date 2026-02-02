// FILE: server/src/models/Tenant.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const TenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    logoUrl: { type: String, default: "", trim: true },

    isArchived: { type: Boolean, default: false },

    // ✅ Soft delete support (needed by your repo/service)
    deletedAt: { type: Date, default: null, index: true },
    deletedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

TenantSchema.index({ slug: 1 }, { unique: true });
TenantSchema.index({ isArchived: 1 });
TenantSchema.index({ deletedAt: 1 });

TenantSchema.pre("validate", function () {
  const doc = this as unknown as { slug?: string };
  if (typeof doc.slug === "string") {
    doc.slug = doc.slug.trim().toLowerCase();
  }
});

export type TenantDoc = InferSchemaType<typeof TenantSchema> & mongoose.Document;

export const Tenant: Model<TenantDoc> =
  (mongoose.models.Tenant as Model<TenantDoc>) ||
  mongoose.model<TenantDoc>("Tenant", TenantSchema);
