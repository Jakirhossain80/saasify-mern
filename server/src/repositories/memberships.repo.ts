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

/**
 * Find membership (any status/role) by tenant + user
 * Used by platform operations (like assigning tenant admin).
 */
export async function findMembershipByTenantAndUser(
  tenantId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<MembershipDoc | null> {
  await connectDB();

  return Membership.findOne({ tenantId, userId }).exec();
}

/**
 * Upsert tenant admin membership
 * - If membership exists: sets role="tenantAdmin", status="active"
 * - If not exists: creates new membership with those values
 */
export async function upsertTenantAdminMembership(
  tenantId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<MembershipDoc> {
  await connectDB();

  const membership = await Membership.findOneAndUpdate(
    { tenantId, userId },
    { $set: { role: "tenantAdmin", status: "active" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).exec();

  // In theory, with upsert:true + new:true, this should never be null.
  // But we keep a safety guard to avoid returning null in TypeScript.
  if (!membership) {
    throw new Error("Failed to upsert tenant admin membership");
  }

  return membership;
}
