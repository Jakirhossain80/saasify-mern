// FILE: server/src/models/Tenant.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Tenant model (Phase 4+)
 * - slug is canonical identity for path-based tenancy: /api/t/:tenantSlug/...
 * - isArchived=true means tenant is inactive and should behave as NOT_FOUND (404) to avoid leaks
 */
const TenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    // Canonical tenant identity for routing
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true, // keep (nice for schema intent)
    },

    // Optional metadata
    logoUrl: { type: String, default: "", trim: true },

    // Treat archived as inactive (resolveTenant returns 404)
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Explicit indexes (recommended in production)
TenantSchema.index({ slug: 1 }, { unique: true }); // critical
TenantSchema.index({ isArchived: 1 }); // optional, helps list filters

// Defensive normalization: keep slug trimmed + lowercase even if set programmatically
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
