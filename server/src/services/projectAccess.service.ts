// FILE: server/src/services/projectAccess.service.ts
import type { Types } from "mongoose";
import { createAuditLog } from "../repositories/auditLogs.repo";
import {
  listProjectMembers,
  removeProjectMember,
  upsertProjectMember,
} from "../repositories/projectAccess.repo";
import type { ProjectAccessRole, ProjectMembershipDoc } from "../models/ProjectMembership";

export async function assignProjectMember(input: {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  role: ProjectAccessRole;
  actorUserId: Types.ObjectId;
}): Promise<ProjectMembershipDoc> {
  const doc = await upsertProjectMember({
    tenantId: input.tenantId,
    projectId: input.projectId,
    userId: input.userId,
    role: input.role,
  });

  await createAuditLog({
    scope: "tenant",
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: "project.updated",
    entity: { type: "Project", id: String(input.projectId) },
    meta: { projectMemberUserId: String(input.userId), projectRole: input.role },
  });

  return doc;
}

export async function unassignProjectMember(input: {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  actorUserId: Types.ObjectId;
}): Promise<ProjectMembershipDoc | null> {
  const doc = await removeProjectMember({
    tenantId: input.tenantId,
    projectId: input.projectId,
    userId: input.userId,
  });

  if (doc) {
    await createAuditLog({
      scope: "tenant",
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "project.updated",
      entity: { type: "Project", id: String(input.projectId) },
      meta: { projectMemberUserId: String(input.userId), removed: true },
    });
  }

  return doc;
}

export async function getProjectMembers(input: {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
}): Promise<ProjectMembershipDoc[]> {
  return listProjectMembers({ tenantId: input.tenantId, projectId: input.projectId });
}
