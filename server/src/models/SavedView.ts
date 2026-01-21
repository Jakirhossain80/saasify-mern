// FILE: server/src/models/SavedView.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const SavedViewSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    // Keep it flexible for future filters (status, search, tags, etc.)
    filters: {
      status: { type: String, enum: ["active", "archived"], default: null },
      search: { type: String, default: null },
    },
    isPinned: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

SavedViewSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });

export type SavedViewDoc = InferSchemaType<typeof SavedViewSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SavedView: Model<SavedViewDoc> =
  (mongoose.models.SavedView as Model<SavedViewDoc>) ||
  mongoose.model<SavedViewDoc>("SavedView", SavedViewSchema);
