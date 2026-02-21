// FILE: server/src/services/projects.service.ts
import type { Types } from "mongoose";
import type { ProjectDoc } from "../models/Project";
import {
  createProjectScoped,
  findProjectByIdScoped,
  listProjectsScoped,
  updateProjectScoped,
  softDeleteProjectScoped,
  type ProjectStatus,
} from "../repositories/projects.repo";

export type ListTenantProjectsInput = {
  tenantId: Types.ObjectId;
  status?: "active" | "archived";
  search?: string;
  limit?: number;
  offset?: number;
};

export async function listTenantProjects(input: ListTenantProjectsInput): Promise<ProjectDoc[]> {
  return listProjectsScoped(input.tenantId, {
    status: input.status,
    search: input.search,
    limit: input.limit,
    offset: input.offset,
  });
}

export type GetTenantProjectByIdInput = {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
};

export async function getTenantProjectById(
  input: GetTenantProjectByIdInput
): Promise<ProjectDoc | null> {
  // ✅ If the project exists in another tenant, repo returns null → controller returns 404 (no leak)
  return findProjectByIdScoped(input.tenantId, input.projectId);
}

export type CreateTenantProjectInput = {
  tenantId: Types.ObjectId;
  title: string;
  description?: string;
  actorUserId: Types.ObjectId;
};

export async function createTenantProject(input: CreateTenantProjectInput): Promise<ProjectDoc> {
  const title = input.title.trim();
  if (!title) {
    // service-level defensive check (controller should validate too)
    throw new Error("VALIDATION_ERROR");
  }

  return createProjectScoped({
    tenantId: input.tenantId,
    title,
    description: (input.description ?? "").trim(),
    createdByUserId: input.actorUserId,
  });
}

/** ✅ ADD: Update project (title/description/status for archive/unarchive) */
export async function updateTenantProject(input: {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
  actorUserId: Types.ObjectId;
  title?: string;
  description?: string;
  status?: ProjectStatus;
}): Promise<ProjectDoc | null> {
  return updateProjectScoped({
    tenantId: input.tenantId,
    projectId: input.projectId,
    actorUserId: input.actorUserId,
    title: input.title,
    description: input.description,
    status: input.status,
  });
}

/** ✅ ADD: Delete project (soft delete) */
export async function deleteTenantProject(input: {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
  actorUserId: Types.ObjectId;
}): Promise<ProjectDoc | null> {
  return softDeleteProjectScoped({
    tenantId: input.tenantId,
    projectId: input.projectId,
    actorUserId: input.actorUserId,
  });
}