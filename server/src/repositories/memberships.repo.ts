// FILE: server/src/repositories/memberships.repo.ts
import mongoose, { type ClientSession, type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Membership, type MembershipDoc } from "../models/Membership";

/**
 * Small helper to safely cast string -> ObjectId
 * (keeps runtime mongoose import so mongoose.Types.ObjectId is available)
 */
function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

/* =========================================================
   Existing (KEEP): Membership creation + RBAC helpers
   ========================================================= */

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

/* =========================================================
   Phase 8 (2): Members Management (ADD)
   - list members
   - update role
   - soft remove (status="removed")
   ========================================================= */

/**
 * List members by tenant (returns memberships of any status)
 * Controller/service can decide to filter if needed.
 */
export async function listMembersByTenantRepo(tenantId: string): Promise<MembershipDoc[]> {
  await connectDB();
  const tid = toObjectId(tenantId);

  return Membership.find({ tenantId: tid }).sort({ createdAt: -1 }).exec();
}

/**
 * Find ACTIVE membership by tenant + user (string ids)
 * Used by members management service safety checks.
 */
export async function findActiveMembershipRepo(
  tenantId: string,
  userId: string
): Promise<MembershipDoc | null> {
  await connectDB();
  const tid = toObjectId(tenantId);
  const uid = toObjectId(userId);

  return Membership.findOne({
    tenantId: tid,
    userId: uid,
    status: "active",
  }).exec();
}

/**
 * Count active tenant admins of a tenant (last-admin protection)
 */
export async function countActiveTenantAdminsRepo(tenantId: string): Promise<number> {
  await connectDB();
  const tid = toObjectId(tenantId);

  return Membership.countDocuments({
    tenantId: tid,
    role: "tenantAdmin",
    status: "active",
  }).exec();
}

/**
 * Update member role (only if membership is active)
 */
export async function updateMemberRoleRepo(
  tenantId: string,
  userId: string,
  role: "tenantAdmin" | "member"
): Promise<MembershipDoc | null> {
  await connectDB();
  const tid = toObjectId(tenantId);
  const uid = toObjectId(userId);

  return Membership.findOneAndUpdate(
    { tenantId: tid, userId: uid, status: "active" },
    { $set: { role } },
    { new: true }
  ).exec();
}

/**
 * Soft remove member (status="removed") only if membership is active
 */
export async function removeMemberRepo(
  tenantId: string,
  userId: string
): Promise<MembershipDoc | null> {
  await connectDB();
  const tid = toObjectId(tenantId);
  const uid = toObjectId(userId);

  return Membership.findOneAndUpdate(
    { tenantId: tid, userId: uid, status: "active" },
    { $set: { status: "removed" } },
    { new: true }
  ).exec();
}
