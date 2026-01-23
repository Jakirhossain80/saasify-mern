// FILE: server/src/services/projects.service.ts
import type { Types } from "mongoose";
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
  tenantId: Types.ObjectId;
  title: string;
  description?: string;
  actorUserId: Types.ObjectId;
};

export type UpdateProjectServiceInput = {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
  title?: string;
  description?: string;
  status?: ProjectStatus;
  actorUserId: Types.ObjectId;
};

export async function createTenantProject(input: CreateProjectServiceInput): Promise<ProjectDoc> {
  // ✅ Fix 7: Always pass a string (repo create already uses `?? ""` anyway)
  // This avoids `string | undefined` issues and keeps payload simple.
  return createProjectScoped({
    tenantId: input.tenantId,
    title: input.title,
    description: input.description ?? "",
    createdByUserId: input.actorUserId,
  });
}

export async function getProjectScoped(
  tenantId: Types.ObjectId,
  projectId: Types.ObjectId
): Promise<ProjectDoc | null> {
  return findProjectByIdScoped(tenantId, projectId);
}

export async function listTenantProjects(
  tenantId: Types.ObjectId,
  opts?: { status?: ProjectStatus; search?: string; limit?: number; offset?: number }
): Promise<ProjectDoc[]> {
  // ✅ No change required: repo already handles defaults and optional filters safely
  return listProjectsScoped(tenantId, opts);
}

export async function updateTenantProject(
  input: UpdateProjectServiceInput
): Promise<ProjectDoc | null> {
  // ✅ Fix 7: don't pass `undefined` values (repo only sets provided fields)
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
  tenantId: Types.ObjectId,
  projectId: Types.ObjectId,
  actorUserId: Types.ObjectId
): Promise<ProjectDoc | null> {
  return archiveProjectScoped(tenantId, projectId, actorUserId);
}

export async function restoreArchivedTenantProject(
  tenantId: Types.ObjectId,
  projectId: Types.ObjectId,
  actorUserId: Types.ObjectId
): Promise<ProjectDoc | null> {
  return restoreArchivedProjectScoped(tenantId, projectId, actorUserId);
}

export async function softDeleteTenantProject(
  tenantId: Types.ObjectId,
  projectId: Types.ObjectId,
  actorUserId: Types.ObjectId
): Promise<ProjectDoc | null> {
  return softDeleteProjectScoped(tenantId, projectId, actorUserId);
}

export async function restoreSoftDeletedTenantProject(
  tenantId: Types.ObjectId,
  projectId: Types.ObjectId,
  actorUserId: Types.ObjectId
): Promise<ProjectDoc | null> {
  return restoreSoftDeletedProjectScoped(tenantId, projectId, actorUserId);
}
