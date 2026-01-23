// FILE: server/src/repositories/invites.repo.ts
import crypto from "crypto";
import type { Types } from "mongoose";

import { connectDB } from "../db/connect";
import { Invite, type InviteDoc, type InviteStatus, type TenantRole } from "../models/Invite";

export type CreateInviteRepoInput = {
  tenantId: Types.ObjectId;
  email: string;
  role: TenantRole;
  tokenHash: string;
  expiresAt: Date;
  invitedByUserId: Types.ObjectId;
};

export type ListInvitesRepoOptions = {
  status?: InviteStatus;
  limit?: number;
  offset?: number;
};

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function createInvite(input: CreateInviteRepoInput): Promise<InviteDoc> {
  await connectDB();
  return Invite.create({
    tenantId: input.tenantId,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    tokenHash: input.tokenHash,
    expiresAt: input.expiresAt,
    invitedByUserId: input.invitedByUserId,
    status: "pending",
  });
}

export async function listInvitesByTenant(
  tenantId: Types.ObjectId,
  opts: ListInvitesRepoOptions = {}
): Promise<InviteDoc[]> {
  await connectDB();

  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  const query: Record<string, unknown> = { tenantId };
  if (opts.status) query.status = opts.status;

  return Invite.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).exec();
}

export async function findInviteByTokenHash(
  tenantId: Types.ObjectId,
  tokenHash: string
): Promise<InviteDoc | null> {
  await connectDB();
  return Invite.findOne({ tenantId, tokenHash }).exec();
}

export async function setInviteStatus(
  tenantId: Types.ObjectId,
  inviteId: Types.ObjectId,
  status: InviteStatus,
  acceptedByUserId?: Types.ObjectId | null
): Promise<InviteDoc | null> {
  await connectDB();
  return Invite.findOneAndUpdate(
    { _id: inviteId, tenantId },
    { $set: { status, acceptedByUserId: acceptedByUserId ?? null } },
    { new: true }
  ).exec();
}

export async function expireOldInvites(now = new Date()): Promise<number> {
  await connectDB();
  const r = await Invite.updateMany(
    { status: "pending", expiresAt: { $lte: now } },
    { $set: { status: "expired" } }
  ).exec();
  return r.modifiedCount ?? 0;
}
