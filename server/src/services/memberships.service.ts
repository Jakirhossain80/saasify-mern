// FILE: server/src/services/memberships.service.ts
import type { Types } from "mongoose";
import type { MembershipDoc, MembershipRole } from "../models/Membership";
import {
  createMembership,
  findMembership,
  listMembershipsForTenant,
  listMembershipsForUser,
  removeMembership,
  updateMembershipRole,
  type CreateMembershipInput,
  type MembershipStatus,
} from "../repositories/memberships.repo";

export async function addMemberToTenant(input: CreateMembershipInput): Promise<MembershipDoc> {
  return createMembership(input);
}

export async function getMembership(
  tenantId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<MembershipDoc | null> {
  return findMembership(tenantId, userId);
}

export async function getTenantMembers(tenantId: Types.ObjectId): Promise<MembershipDoc[]> {
  return listMembershipsForTenant(tenantId);
}

export async function getUserMemberships(userId: Types.ObjectId): Promise<MembershipDoc[]> {
  return listMembershipsForUser(userId);
}

export async function changeMemberRole(
  tenantId: Types.ObjectId,
  userId: Types.ObjectId,
  role: MembershipRole
): Promise<MembershipDoc | null> {
  return updateMembershipRole(tenantId, userId, role);
}

export async function removeMember(
  tenantId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<MembershipDoc | null> {
  return removeMembership(tenantId, userId);
}

/**
 * Helper used by invites flow.
 * Returns true only when a new membership was created.
 */
export async function addMembershipIfNotExists(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MembershipRole;
  status?: MembershipStatus;
}): Promise<boolean> {
  const existing = await findMembership(input.tenantId, input.userId);
  if (existing) return false;

  // Build object without passing explicit `undefined` (works well with exactOptionalPropertyTypes)
  const payload: CreateMembershipInput = {
    tenantId: input.tenantId,
    userId: input.userId,
    role: input.role,
    ...(input.status ? { status: input.status } : {}),
  };

  await createMembership(payload);
  return true;
}
