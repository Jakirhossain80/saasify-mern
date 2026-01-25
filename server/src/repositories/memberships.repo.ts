// FILE: server/src/repositories/memberships.repo.ts
import { type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Membership, type MembershipDoc } from "../models/Membership";

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
