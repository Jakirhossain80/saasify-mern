// FILE: server/src/repositories/memberships.repo.ts
import type mongoose from "mongoose";
import { connectDB } from "../db/connect";
import { Membership, type MembershipDoc, type MembershipRole } from "../models/Membership";

export type MembershipStatus = "active" | "removed";

export type CreateMembershipInput = {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: MembershipRole;
  status?: MembershipStatus;
};

export async function createMembership(input: CreateMembershipInput): Promise<MembershipDoc> {
  await connectDB();
  return Membership.create({
    tenantId: input.tenantId,
    userId: input.userId,
    role: input.role,
    status: input.status ?? "active",
  });
}

export async function findMembership(
  tenantId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
): Promise<MembershipDoc | null> {
  await connectDB();
  return Membership.findOne({
    tenantId,
    userId,
    status: { $ne: "removed" },
  }).exec();
}

export async function listMembershipsForTenant(
  tenantId: mongoose.Types.ObjectId
): Promise<MembershipDoc[]> {
  await connectDB();
  return Membership.find({
    tenantId,
    status: { $ne: "removed" },
  })
    .sort({ createdAt: -1 })
    .exec();
}

export async function listMembershipsForUser(
  userId: mongoose.Types.ObjectId
): Promise<MembershipDoc[]> {
  await connectDB();
  return Membership.find({
    userId,
    status: { $ne: "removed" },
  })
    .sort({ createdAt: -1 })
    .exec();
}

export async function updateMembershipRole(
  tenantId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  role: MembershipRole
): Promise<MembershipDoc | null> {
  await connectDB();
  return Membership.findOneAndUpdate(
    { tenantId, userId, status: { $ne: "removed" } },
    { $set: { role } },
    { new: true }
  ).exec();
}

export async function removeMembership(
  tenantId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
): Promise<MembershipDoc | null> {
  await connectDB();
  return Membership.findOneAndUpdate(
    { tenantId, userId },
    { $set: { status: "removed" } },
    { new: true }
  ).exec();
}
