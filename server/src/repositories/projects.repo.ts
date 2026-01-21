// FILE: server/src/repositories/projects.repo.ts
import type mongoose from "mongoose";
import { connectDB } from "../db/connect";
import { Project, type ProjectDoc } from "../models/Project";

export type ProjectStatus = "active" | "archived";

export type CreateProjectRepoInput = {
  tenantId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  createdByUserId: mongoose.Types.ObjectId;
};

export type UpdateProjectRepoInput = {
  tenantId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  title?: string;
  description?: string;
  status?: ProjectStatus;
  updatedByUserId: mongoose.Types.ObjectId;
};

export type ListProjectsRepoOptions = {
  status?: ProjectStatus;
  search?: string;
  limit?: number;
  offset?: number;
};

export async function createProjectScoped(input: CreateProjectRepoInput): Promise<ProjectDoc> {
  await connectDB();

  const doc = await Project.create({
    tenantId: input.tenantId,
    title: input.title,
    description: input.description ?? "",
    createdByUserId: input.createdByUserId,
    updatedByUserId: null,
    status: "active",
    deletedAt: null,
  });

  return doc;
}

export async function findProjectByIdScoped(
  tenantId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId
): Promise<ProjectDoc | null> {
  await connectDB();
  return Project.findOne({ _id: projectId, tenantId, deletedAt: null }).exec();
}

export async function listProjectsScoped(
  tenantId: mongoose.Types.ObjectId,
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

  const search = options.search?.trim();
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  return Project.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).exec();
}

export async function updateProjectScoped(input: UpdateProjectRepoInput): Promise<ProjectDoc | null> {
  await connectDB();

  const $set: Record<string, unknown> = {
    updatedByUserId: input.updatedByUserId,
  };

  if (typeof input.title === "string") $set.title = input.title;
  if (typeof input.description === "string") $set.description = input.description;
  if (input.status) $set.status = input.status;

  return Project.findOneAndUpdate(
    { _id: input.projectId, tenantId: input.tenantId, deletedAt: null },
    { $set },
    { new: true }
  ).exec();
}

export async function archiveProjectScoped(
  tenantId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId,
  updatedByUserId: mongoose.Types.ObjectId
): Promise<ProjectDoc | null> {
  await connectDB();
  return Project.findOneAndUpdate(
    { _id: projectId, tenantId, deletedAt: null },
    { $set: { status: "archived", updatedByUserId } },
    { new: true }
  ).exec();
}

export async function restoreArchivedProjectScoped(
  tenantId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId,
  updatedByUserId: mongoose.Types.ObjectId
): Promise<ProjectDoc | null> {
  await connectDB();
  return Project.findOneAndUpdate(
    { _id: projectId, tenantId, deletedAt: null },
    { $set: { status: "active", updatedByUserId } },
    { new: true }
  ).exec();
}

export async function softDeleteProjectScoped(
  tenantId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId,
  updatedByUserId: mongoose.Types.ObjectId
): Promise<ProjectDoc | null> {
  await connectDB();
  return Project.findOneAndUpdate(
    { _id: projectId, tenantId, deletedAt: null },
    { $set: { deletedAt: new Date(), updatedByUserId } },
    { new: true }
  ).exec();
}

export async function restoreSoftDeletedProjectScoped(
  tenantId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId,
  updatedByUserId: mongoose.Types.ObjectId
): Promise<ProjectDoc | null> {
  await connectDB();
  return Project.findOneAndUpdate(
    { _id: projectId, tenantId, deletedAt: { $ne: null } },
    { $set: { deletedAt: null, updatedByUserId } },
    { new: true }
  ).exec();
}
