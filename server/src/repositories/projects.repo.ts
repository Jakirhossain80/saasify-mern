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

export function toObjectId(id: string): Types.ObjectId | null {
  const trimmed = id.trim();
  if (!mongoose.isValidObjectId(trimmed)) return null;
  return new mongoose.Types.ObjectId(trimmed);
}
