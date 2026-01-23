// FILE: server/src/services/invites.service.ts
import crypto from "crypto";
import type { Types } from "mongoose";

import { createAuditLog } from "../repositories/auditLogs.repo";
import {
  createInvite,
  expireOldInvites,
  hashToken,
  listInvitesByTenant,
  setInviteStatus,
  findInviteByTokenHash,
} from "../repositories/invites.repo";
import type { InviteDoc, TenantRole } from "../models/Invite";
import { addMembershipIfNotExists } from "./memberships.service";

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

export async function createTenantInvite(input: {
  tenantId: Types.ObjectId;
  email: string;
  role: TenantRole;
  invitedByUserId: Types.ObjectId;
  expiresInHours?: number;
}): Promise<{ invite: InviteDoc; rawToken: string }> {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(
    Date.now() + (input.expiresInHours ?? 72) * 60 * 60 * 1000
  );

  const invite = await createInvite({
    tenantId: input.tenantId,
    email: input.email,
    role: input.role,
    tokenHash,
    expiresAt,
    invitedByUserId: input.invitedByUserId,
  });

  await createAuditLog({
    scope: "tenant",
    tenantId: input.tenantId,
    actorUserId: input.invitedByUserId,
    action: "invite.created",
    entity: { type: "Invite", id: String(invite._id) },
    meta: {
      email: input.email.toLowerCase(),
      role: input.role,
      expiresAt: invite.expiresAt,
    },
  });

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
    await createAuditLog({
      scope: "tenant",
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: "invite.revoked",
      entity: { type: "Invite", id: String(updated._id) },
      meta: { email: updated.email },
    });
  }

  return updated;
}

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

  const updated = await setInviteStatus(
    input.tenantId,
    invite._id,
    "accepted",
    input.acceptedByUserId
  );
  if (!updated) return null;

  const membershipCreated = await addMembershipIfNotExists({
    tenantId: input.tenantId,
    userId: input.acceptedByUserId,
    role: updated.role,
  });

  await createAuditLog({
    scope: "tenant",
    tenantId: input.tenantId,
    actorUserId: input.acceptedByUserId,
    action: "invite.accepted",
    entity: { type: "Invite", id: String(updated._id) },
    meta: { email: updated.email, role: updated.role, membershipCreated },
  });

  return { invite: updated, membershipCreated };
}
