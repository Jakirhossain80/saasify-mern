// FILE: server/src/services/projects.service.ts
import type { Types } from "mongoose";
import type { ProjectDoc } from "../models/Project";
import {
  createProjectScoped,
  findProjectByIdScoped,
  listProjectsScoped,
} from "../repositories/projects.repo";

export async function listTenantProjects(input: {
  tenantId: Types.ObjectId;
  status?: "active" | "archived";
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ProjectDoc[]> {
  return listProjectsScoped(input.tenantId, {
    status: input.status,
    search: input.search,
    limit: input.limit,
    offset: input.offset,
  });
}

export async function getTenantProjectById(input: {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
}): Promise<ProjectDoc | null> {
  // ✅ If the project exists in another tenant, repo returns null → controller returns 404 (no leak)
  return findProjectByIdScoped(input.tenantId, input.projectId);
}

export async function createTenantProject(input: {
  tenantId: Types.ObjectId;
  title: string;
  description?: string;
  actorUserId: Types.ObjectId;
}): Promise<ProjectDoc> {
  return createProjectScoped({
    tenantId: input.tenantId,
    title: input.title,
    description: input.description ?? "",
    createdByUserId: input.actorUserId,
  });
}
