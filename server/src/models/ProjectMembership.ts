// FILE: server/src/models/ProjectMembership.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export type ProjectAccessRole = "viewer" | "editor";

const ProjectMembershipSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, required: true, enum: ["viewer", "editor"], default: "viewer" },
    status: {
      type: String,
      required: true,
      enum: ["active", "removed"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

ProjectMembershipSchema.index({ tenantId: 1, projectId: 1, userId: 1 }, { unique: true });

export type ProjectMembershipDoc = InferSchemaType<typeof ProjectMembershipSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProjectMembership: Model<ProjectMembershipDoc> =
  (mongoose.models.ProjectMembership as Model<ProjectMembershipDoc>) ||
  mongoose.model<ProjectMembershipDoc>("ProjectMembership", ProjectMembershipSchema);
