// FILE: server/src/models/Tenant.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Tenant model
 * - slug is canonical identity for routing: /t/:tenantSlug
 * - isArchived=true means tenant inactive (soft disable)
 * - deletedAt != null means soft-deleted (hidden by default)
 */
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

    // ✅ Archive support
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },
    archivedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // ✅ Soft delete support (already used by repo/service)
    deletedAt: { type: Date, default: null, index: true },
    deletedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

TenantSchema.index({ slug: 1 }, { unique: true });
// (isArchived, deletedAt already indexed via index:true above; keeping extra indexes is optional)

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
