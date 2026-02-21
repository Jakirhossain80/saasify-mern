// FILE: server/src/repositories/projects.repo.ts
import mongoose, { type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Project, type ProjectDoc } from "../models/Project";

export type ProjectStatus = "active" | "archived";

export type ListProjectsRepoOptions = {
  status?: ProjectStatus;
  search?: string;
  limit?: number;
  offset?: number;
};

export type CreateProjectRepoInput = {
  tenantId: Types.ObjectId;
  title: string;
  description?: string;
  createdByUserId: Types.ObjectId;
};

export type UpdateProjectRepoInput = {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
  actorUserId: Types.ObjectId;
  title?: string;
  description?: string;
  status?: ProjectStatus;
};

function escapeRegex(input: string): string {
  // Prevent regex DoS / accidental special chars
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createProjectScoped(input: CreateProjectRepoInput): Promise<ProjectDoc> {
  await connectDB();

  return Project.create({
    tenantId: input.tenantId,
    title: input.title.trim(),
    description: (input.description ?? "").trim(),
    status: "active",

    // Keep these aligned with your Project schema
    createdByUserId: input.createdByUserId,
    updatedByUserId: input.createdByUserId, // better default than null for audit fields

    deletedAt: null,
    deletedByUserId: null,
  });
}

export async function findProjectByIdScoped(
  tenantId: Types.ObjectId,
  projectId: Types.ObjectId
): Promise<ProjectDoc | null> {
  await connectDB();

  // ✅ Strict tenant isolation: must include tenantId
  return Project.findOne({ _id: projectId, tenantId, deletedAt: null }).exec();
}

export async function listProjectsScoped(
  tenantId: Types.ObjectId,
  options: ListProjectsRepoOptions = {}
): Promise<ProjectDoc[]> {
  await connectDB();

  const limit = Math.min(Math.max(options.limit ?? 12, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const query: Record<string, unknown> = {
    tenantId,
    deletedAt: null,
  };

  if (options.status) query.status = options.status;

  const searchRaw = options.search?.trim();
  if (searchRaw) {
    const search = escapeRegex(searchRaw);
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  return Project.find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
}

/** ✅ ADD: Update project (status/title/description) */
export async function updateProjectScoped(input: UpdateProjectRepoInput): Promise<ProjectDoc | null> {
  await connectDB();

  const update: Record<string, unknown> = {
    updatedByUserId: input.actorUserId,
  };

  if (typeof input.title === "string") update.title = input.title.trim();
  if (typeof input.description === "string") update.description = input.description.trim();
  if (input.status) update.status = input.status;

  return Project.findOneAndUpdate(
    { _id: input.projectId, tenantId: input.tenantId, deletedAt: null },
    { $set: update },
    { new: true }
  ).exec();
}

/** ✅ ADD: Soft delete project (keeps record) */
export async function softDeleteProjectScoped(input: {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
  actorUserId: Types.ObjectId;
}): Promise<ProjectDoc | null> {
  await connectDB();

  return Project.findOneAndUpdate(
    { _id: input.projectId, tenantId: input.tenantId, deletedAt: null },
    {
      $set: {
        deletedAt: new Date(),
        deletedByUserId: input.actorUserId,
        updatedByUserId: input.actorUserId,
      },
    },
    { new: true }
  ).exec();
}

export function toObjectId(id: string): Types.ObjectId | null {
  const trimmed = id.trim();
  if (!mongoose.isValidObjectId(trimmed)) return null;
  return new mongoose.Types.ObjectId(trimmed);
}