// FILE: server/src/repositories/invites.repo.ts
import crypto from "crypto";
import mongoose, { type Types } from "mongoose";

import { connectDB } from "../db/connect";
import {
  Invite,
  type InviteDoc,
  type InviteStatus,
  type TenantRole,
} from "../models/Invite";

/**
 * ✅ NOTE (Safe merge strategy)
 * - Keeps your existing secure design: store ONLY tokenHash in DB (never raw token).
 * - Adds the “Phase 8 Invites” repo helpers you need:
 *   - findPendingInviteByEmailRepo
 *   - createInviteRepo
 *   - listInvitesByTenantRepo (page/limit)
 *   - revokeInviteRepo (set status="revoked" for pending invites)
 * - Preserves your existing exports for Phase 9+:
 *   - createInvite, listInvitesByTenant, findInviteByTokenHash, setInviteStatus, expireOldInvites
 */

// -------------------- Types --------------------
export type InviteRole = TenantRole; // "tenantAdmin" | "member"

// -------------------- Token helpers (existing) --------------------
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateInviteToken(byteLength = 32): string {
  // URL-safe enough for passing via email link later (Phase 9)
  return crypto.randomBytes(byteLength).toString("hex");
}

// -------------------- Existing repo functions (kept) --------------------
export type CreateInviteRepoInputSecure = {
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

export async function createInvite(input: CreateInviteRepoInputSecure): Promise<InviteDoc> {
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

// =====================================================================
// ✅ Phase 8 “Invites module” repo helpers (added, without breaking old)
// =====================================================================

export type CreateInviteRepoInput = {
  tenantId: Types.ObjectId;
  email: string; // lowercase
  role: InviteRole;
  token: string; // raw token (will be hashed before save)
  expiresAt: Date;
  invitedByUserId: Types.ObjectId;
};

/**
 * Find duplicate pending invite by (tenantId + email + status=pending)
 * Used to block duplicate pending invites.
 */
export async function findPendingInviteByEmailRepo(input: {
  tenantId: Types.ObjectId;
  email: string;
}) {
  await connectDB();
  return Invite.findOne({
    tenantId: input.tenantId,
    email: input.email.trim().toLowerCase(),
    status: "pending",
  })
    .select({ _id: 1 })
    .lean()
    .exec();
}

/**
 * Create a new invite (stores tokenHash only).
 * - Returns a plain object for easy controller response shaping.
 */
export async function createInviteRepo(input: CreateInviteRepoInput) {
  await connectDB();

  const tokenHash = hashToken(input.token);

  const doc = await Invite.create({
    tenantId: input.tenantId,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    tokenHash,
    expiresAt: input.expiresAt,
    invitedByUserId: input.invitedByUserId,
    status: "pending",
  });

  return doc.toObject();
}

/**
 * List invites for a tenant with page/limit + total (simple pagination).
 */
export async function listInvitesByTenantRepo(input: {
  tenantId: Types.ObjectId;
  page: number;
  limit: number;
  status?: InviteStatus;
}) {
  await connectDB();

  const page = Math.max(input.page, 1);
  const limit = Math.min(Math.max(input.limit, 1), 100);
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { tenantId: input.tenantId };
  if (input.status) query.status = input.status;

  const [items, total] = await Promise.all([
    Invite.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select({
        _id: 1,
        tenantId: 1,
        email: 1,
        role: 1,
        status: 1,
        expiresAt: 1,
        invitedByUserId: 1,
        acceptedByUserId: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .lean()
      .exec(),
    Invite.countDocuments(query).exec(),
  ]);

  return {
    items: items.map((i: any) => ({
      id: String(i._id),
      tenantId: String(i.tenantId),
      email: i.email,
      role: i.role,
      status: i.status,
      expiresAt: i.expiresAt,
      invitedByUserId: i.invitedByUserId ? String(i.invitedByUserId) : null,
      acceptedByUserId: i.acceptedByUserId ? String(i.acceptedByUserId) : null,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    })),
    total,
    page,
    limit,
  };
}

/**
 * Revoke invite (only pending invites can be revoked).
 * - Uses a strict filter: {_id, tenantId, status:"pending"}
 * - Sets status="revoked"
 * - Optionally sets revokedByUserId/revokedAt if your schema supports it.
 */
export async function revokeInviteRepo(input: {
  tenantId: Types.ObjectId;
  inviteId: Types.ObjectId;
  revokedByUserId: Types.ObjectId;
}) {
  await connectDB();

  // (Optional) Validate object ids defensively
  if (!mongoose.isValidObjectId(String(input.tenantId)) || !mongoose.isValidObjectId(String(input.inviteId))) {
    return null;
  }

  const updated = await Invite.findOneAndUpdate(
    { _id: input.inviteId, tenantId: input.tenantId, status: "pending" },
    {
      $set: {
        status: "revoked",
        // These two fields are safe even if schema doesn’t include them:
        // mongoose strict mode will ignore unknown fields.
        revokedByUserId: input.revokedByUserId,
        revokedAt: new Date(),
        updatedAt: new Date(),
      } as any,
    },
    { new: true }
  )
    .lean()
    .exec();

  return updated;
}
