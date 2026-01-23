// FILE: server/src/repositories/projectAccess.repo.ts
import type { Types } from "mongoose";
import { connectDB } from "../db/connect";
import {
  ProjectMembership,
  type ProjectMembershipDoc,
  type ProjectAccessRole,
} from "../models/ProjectMembership";

export async function upsertProjectMember(input: {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
  role: ProjectAccessRole;
}): Promise<ProjectMembershipDoc> {
  await connectDB();

  const doc = await ProjectMembership.findOneAndUpdate(
    {
      tenantId: input.tenantId,
      projectId: input.projectId,
      userId: input.userId,
    },
    { $set: { role: input.role, status: "active" } },
    { upsert: true, new: true }
  ).exec();

  if (!doc) throw new Error("PROJECT_MEMBER_UPSERT_FAILED");
  return doc;
}

export async function removeProjectMember(input: {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
  userId: Types.ObjectId;
}): Promise<ProjectMembershipDoc | null> {
  await connectDB();

  return ProjectMembership.findOneAndUpdate(
    {
      tenantId: input.tenantId,
      projectId: input.projectId,
      userId: input.userId,
    },
    { $set: { status: "removed" } },
    { new: true }
  ).exec();
}

export async function listProjectMembers(input: {
  tenantId: Types.ObjectId;
  projectId: Types.ObjectId;
}): Promise<ProjectMembershipDoc[]> {
  await connectDB();

  return ProjectMembership.find({
    tenantId: input.tenantId,
    projectId: input.projectId,
    status: "active",
  })
    .sort({ createdAt: -1 })
    .exec();
}
