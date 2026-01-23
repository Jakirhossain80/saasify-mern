// FILE: server/src/models/Tenant.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const TenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    // Slug is the canonical tenant identity in Phase 4 routes: /api/t/:tenantSlug/...
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },

    // Optional tenant metadata
    logoUrl: { type: String, default: "", trim: true },

    // Phase-4: treat archived as inactive (404 on archived tenants)
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export type TenantDoc = InferSchemaType<typeof TenantSchema> & mongoose.Document;

export const Tenant: Model<TenantDoc> =
  (mongoose.models.Tenant as Model<TenantDoc>) || mongoose.model<TenantDoc>("Tenant", TenantSchema);
