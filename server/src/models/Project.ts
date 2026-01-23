// FILE: server/src/models/Project.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ProjectSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: "", trim: true, maxlength: 2000 },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },

    // ✅ Audit fields (so your repo/service can safely set createdBy/updatedBy)
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    updatedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // Soft delete (tenant-scoped). Keep records for restore/audit.
    deletedAt: { type: Date, default: null, index: true },
    deletedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Helpful indexes for tenant-scoped queries
ProjectSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
ProjectSchema.index({ tenantId: 1, deletedAt: 1 });

// Helpful audit index
ProjectSchema.index({ tenantId: 1, createdByUserId: 1, createdAt: -1 });

export type ProjectDoc = InferSchemaType<typeof ProjectSchema> & mongoose.Document;

export const Project: Model<ProjectDoc> =
  (mongoose.models.Project as Model<ProjectDoc>) ||
  mongoose.model<ProjectDoc>("Project", ProjectSchema);
