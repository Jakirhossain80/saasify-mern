// FILE: server/src/repositories/memberships.repo.ts
import { type ClientSession, type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Membership, type MembershipDoc } from "../models/Membership";

/**
 * Create a membership (used during invite acceptance, signup bootstrap, etc.)
 */
export async function createMembershipRepo(
  input: {
    tenantId: Types.ObjectId;
    userId: Types.ObjectId;
    role: "tenantAdmin" | "member";
    status: "active" | "removed";
  },
  session?: ClientSession
): Promise<MembershipDoc> {
  await connectDB();

  const doc = new Membership({
    tenantId: input.tenantId,
    userId: input.userId,
    role: input.role,
    status: input.status,
  });

  await doc.save({ session });
  return doc;
}

/**
 * RBAC helper
 * Used by:
 * - requireTenantMembership
 * - requireTenantRole
 * - rbac.service.ts
 */
export async function getActiveMembershipByTenantAndUser(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
}): Promise<MembershipDoc | null> {
  await connectDB();

  return Membership.findOne({
    tenantId: input.tenantId,
    userId: input.userId,
    status: "active",
  }).exec();
}
