// FILE: server/src/services/projects.service.ts
import type mongoose from "mongoose";
import type { ProjectDoc } from "../models/Project";
import {
  archiveProjectScoped,
  createProjectScoped,
  findProjectByIdScoped,
  listProjectsScoped,
  restoreArchivedProjectScoped,
  restoreSoftDeletedProjectScoped,
  softDeleteProjectScoped,
  updateProjectScoped,
  type ProjectStatus,
} from "../repositories/projects.repo";

export type CreateProjectServiceInput = {
  tenantId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  actorUserId: mongoose.Types.ObjectId;
};

export type UpdateProjectServiceInput = {
  tenantId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  title?: string;
  description?: string;
  status?: ProjectStatus;
  actorUserId: mongoose.Types.ObjectId;
};

export async function createTenantProject(input: CreateProjectServiceInput): Promise<ProjectDoc> {
  return createProjectScoped({
    tenantId: input.tenantId,
    title: input.title,
    description: input.description,
    createdByUserId: input.actorUserId,
  });
}

export async function getProjectScoped(
  tenantId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId
): Promise<ProjectDoc | null> {
  return findProjectByIdScoped(tenantId, projectId);
}

export async function listTenantProjects(
  tenantId: mongoose.Types.ObjectId,
  opts?: { status?: ProjectStatus; search?: string; limit?: number; offset?: number }
): Promise<ProjectDoc[]> {
  return listProjectsScoped(tenantId, opts);
}

export async function updateTenantProject(input: UpdateProjectServiceInput): Promise<ProjectDoc | null> {
  return updateProjectScoped({
    tenantId: input.tenantId,
    projectId: input.projectId,
    title: input.title,
    description: input.description,
    status: input.status,
    updatedByUserId: input.actorUserId,
  });
}

export async function archiveTenantProject(
  tenantId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId,
  actorUserId: mongoose.Types.ObjectId
): Promise<ProjectDoc | null> {
  return archiveProjectScoped(tenantId, projectId, actorUserId);
}

export async function restoreArchivedTenantProject(
  tenantId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId,
  actorUserId: mongoose.Types.ObjectId
): Promise<ProjectDoc | null> {
  return restoreArchivedProjectScoped(tenantId, projectId, actorUserId);
}

export async function softDeleteTenantProject(
  tenantId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId,
  actorUserId: mongoose.Types.ObjectId
): Promise<ProjectDoc | null> {
  return softDeleteProjectScoped(tenantId, projectId, actorUserId);
}

export async function restoreSoftDeletedTenantProject(
  tenantId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId,
  actorUserId: mongoose.Types.ObjectId
): Promise<ProjectDoc | null> {
  return restoreSoftDeletedProjectScoped(tenantId, projectId, actorUserId);
}
