// FILE: server/src/services/invites.service.ts
import crypto from "crypto";
import type { Types } from "mongoose";
import { connectDB } from "../db/connect";

import { createAuditLog } from "../repositories/auditLogs.repo";
import {
  createInvite,
  expireOldInvites,
  hashToken,
  listInvitesByTenant,
  setInviteStatus,
  findInviteByTokenHash,
  findPendingInviteByEmailRepo,
  listInvitesByTenantRepo,
  revokeInviteRepo,
} from "../repositories/invites.repo";

import type { InviteDoc, TenantRole } from "../models/Invite";
import { Membership } from "../models/Membership";
import { User } from "../models/User"; // ✅ ADD (for email match safety)

// helper: satisfy exactOptionalPropertyTypes (don't pass undefined props)
function cleanListOpts(input?: {
  status?: "pending" | "accepted" | "revoked" | "expired";
  limit?: number;
  offset?: number;
}) {
  const opts: {
    status?: "pending" | "accepted" | "revoked" | "expired";
    limit?: number;
    offset?: number;
  } = {};

  if (input?.status) opts.status = input.status;
  if (typeof input?.limit === "number") opts.limit = input.limit;
  if (typeof input?.offset === "number") opts.offset = input.offset;

  return opts;
}

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function makeHttpError(input: { statusCode: number; code: string; message: string }) {
  const err: any = new Error(input.message);
  err.statusCode = input.statusCode;
  err.code = input.code;
  err.message = input.message;
  return err;
}

/**
 * ✅ BEST-EFFORT audit log:
 * If audit log fails, do NOT break the main business flow.
 */
async function safeAudit(fn: () => Promise<any>) {
  try {
    await fn();
  } catch (e) {
    console.error("[auditLog] failed:", e);
  }
}

/**
 * ✅ FIX: Ensure membership becomes ACTIVE on invite accept
 */
async function ensureActiveMembershipFromInvite(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "tenantAdmin" | "member";
}) {
  await connectDB();

  const existing = await Membership.findOne({
    tenantId: input.tenantId,
    userId: input.userId,
  }).exec();

  const membershipCreated = !existing;

  const updatedMembership = await Membership.findOneAndUpdate(
    { tenantId: input.tenantId, userId: input.userId },
    {
      $set: {
        role: input.role,
        status: "active",
      },
    },
    { new: true, upsert: true }
  ).exec();

  if (!updatedMembership) {
    throw makeHttpError({
      statusCode: 500,
      code: "MEMBERSHIP_UPSERT_FAILED",
      message: "Failed to create/activate membership.",
    });
  }

  return { membershipCreated, membership: updatedMembership };
}

/**
 * Create a tenant invite
 */
export async function createTenantInvite(input: {
  tenantId: Types.ObjectId;
  email: string;
  role: TenantRole;
  invitedByUserId: Types.ObjectId;
  expiresInHours?: number;
}): Promise<{ invite: InviteDoc; rawToken: string }> {
  await expireOldInvites();

  const email = input.email.trim().toLowerCase();

  const exists = await findPendingInviteByEmailRepo({ tenantId: input.tenantId, email });
  if (exists) {
    throw makeHttpError({
      statusCode: 409,
      code: "DUPLICATE_INVITE",
      message: "A pending invite already exists for this email in this tenant.",
    });
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(Date.now() + (input.expiresInHours ?? 168) * 60 * 60 * 1000);

  const invite = await createInvite({
    tenantId: input.tenantId,
    email,
    role: input.role,
    tokenHash,
    expiresAt,
    invitedByUserId: input.invitedByUserId,
  });

  await safeAudit(() =>
    createAuditLog({
      scope: "tenant",
      tenantId: input.tenantId,
      actorUserId: input.invitedByUserId,
      action: "invite.created",
      entity: { type: "Invite", id: String((invite as any)._id) },
      meta: { email, role: input.role, expiresAt },
    })
  );

  return { invite, rawToken };
}

export async function listTenantInvites(input: {
  tenantId: Types.ObjectId;
  status?: "pending" | "accepted" | "revoked" | "expired";
  limit?: number;
  offset?: number;
}): Promise<InviteDoc[]> {
  await expireOldInvites();
  return listInvitesByTenant(input.tenantId, cleanListOpts(input));
}

export async function revokeTenantInvite(input: {
  tenantId: Types.ObjectId;
  inviteId: Types.ObjectId;
  actorUserId: Types.ObjectId;
}): Promise<InviteDoc | null> {
  const updated = await setInviteStatus(input.tenantId, input.inviteId, "revoked");

  if (updated) {
    await safeAudit(() =>
      createAuditLog({
        scope: "tenant",
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        action: "invite.revoked",
        entity: { type: "Invite", id: String((updated as any)._id) },
        meta: { email: (updated as any).email },
      })
    );
  }

  return updated;
}

/**
 * ✅ Accept invite
 * FIXED:
 * - Validate invite email matches logged-in user's email
 * - Ensure membership becomes ACTIVE
 */
export async function acceptTenantInvite(input: {
  tenantId: Types.ObjectId;
  rawToken: string;
  acceptedByUserId: Types.ObjectId;
}): Promise<{ invite: InviteDoc; membershipCreated: boolean } | null> {
  await expireOldInvites();

  const tokenHash = hashToken(input.rawToken);
  const invite = await findInviteByTokenHash(input.tenantId, tokenHash);

  if (!invite) return null;
  if (invite.status !== "pending") return null;
  if (invite.expiresAt.getTime() <= Date.now()) return null;

  // ✅ IMPORTANT SAFETY: only the invited email can accept
  const user = await User.findById(input.acceptedByUserId).select("email").lean();
  if (!user?.email) return null;

  const loggedEmail = String(user.email).trim().toLowerCase();
  const invitedEmail = String((invite as any).email).trim().toLowerCase();

  if (loggedEmail !== invitedEmail) {
    throw makeHttpError({
      statusCode: 403,
      code: "INVITE_EMAIL_MISMATCH",
      message: "This invite was issued for a different email.",
    });
  }

  const updated = await setInviteStatus(
    input.tenantId,
    (invite as any)._id,
    "accepted",
    input.acceptedByUserId
  );
  if (!updated) return null;

  const { membershipCreated } = await ensureActiveMembershipFromInvite({
    tenantId: input.tenantId,
    userId: input.acceptedByUserId,
    role: (updated as any).role,
  });

  await safeAudit(() =>
    createAuditLog({
      scope: "tenant",
      tenantId: input.tenantId,
      actorUserId: input.acceptedByUserId,
      action: "invite.accepted",
      entity: { type: "Invite", id: String((updated as any)._id) },
      meta: { email: (updated as any).email, role: (updated as any).role, membershipCreated },
    })
  );

  return { invite: updated, membershipCreated };
}

/**
 * PHASE 8 SERVICES (controller friendly)
 */

export async function createInviteService(input: {
  tenantId: Types.ObjectId;
  email: string;
  role: "tenantAdmin" | "member";
  invitedByUserId: Types.ObjectId;
}) {
  const role: TenantRole = input.role;

  const { invite, rawToken } = await createTenantInvite({
    tenantId: input.tenantId,
    email: input.email,
    role,
    invitedByUserId: input.invitedByUserId,
    expiresInHours: 168,
  });

  return {
    invite: {
      id: String((invite as any)._id),
      tenantId: String((invite as any).tenantId),
      email: (invite as any).email,
      role: (invite as any).role,
      status: (invite as any).status,
      token: rawToken,
      expiresAt: (invite as any).expiresAt,
      invitedByUserId: String((invite as any).invitedByUserId),
      createdAt: (invite as any).createdAt,
      updatedAt: (invite as any).updatedAt,
    },
  };
}

export async function listInvitesService(input: {
  tenantId: Types.ObjectId;
  page: number;
  limit: number;
  status?: "pending" | "accepted" | "revoked" | "expired";
}) {
  await expireOldInvites();

  const result = await listInvitesByTenantRepo({
    tenantId: input.tenantId,
    page: input.page,
    limit: input.limit,
    status: input.status,
  });

  return result;
}

export async function revokeInviteService(input: {
  tenantId: Types.ObjectId;
  inviteId: Types.ObjectId;
  revokedByUserId: Types.ObjectId;
}) {
  const updated = await revokeInviteRepo({
    tenantId: input.tenantId,
    inviteId: input.inviteId,
    revokedByUserId: input.revokedByUserId,
  });

  if (!updated) {
    throw makeHttpError({
      statusCode: 404,
      code: "INVITE_NOT_FOUND",
      message: "Invite not found (or already accepted/revoked/expired).",
    });
  }

  await safeAudit(() =>
    createAuditLog({
      scope: "tenant",
      tenantId: input.tenantId,
      actorUserId: input.revokedByUserId,
      action: "invite.revoked",
      entity: { type: "Invite", id: String((updated as any)._id) },
      meta: { email: (updated as any).email },
    })
  );

  return {
    ok: true,
    inviteId: String((updated as any)._id),
    status: (updated as any).status as "revoked",
  };
}

export async function acceptInviteService(input: {
  tenantId: Types.ObjectId;
  token: string;
  acceptedByUserId: Types.ObjectId;
}) {
  const result = await acceptTenantInvite({
    tenantId: input.tenantId,
    rawToken: input.token,
    acceptedByUserId: input.acceptedByUserId,
  });

  if (!result) {
    throw makeHttpError({
      statusCode: 400,
      code: "INVALID_INVITE",
      message: "Invite is invalid / expired / already used.",
    });
  }

  return {
    ok: true,
    role: (result.invite as any).role as "tenantAdmin" | "member",
    membershipCreated: result.membershipCreated,
  };
}