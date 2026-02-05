// FILE: server/src/services/memberships.service.ts
import type { Types } from "mongoose";
import type { MembershipDoc, MembershipRole } from "../models/Membership";
import { Tenant } from "../models/Tenant";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import {
  createMembershipRepo,
  getActiveMembershipByTenantAndUser,
  findMembershipByTenantAndUser,
  upsertTenantAdminMembership,
} from "../repositories/memberships.repo";

export type MembershipStatus = "active" | "removed";

export type CreateMembershipInput = {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MembershipRole;
  status?: MembershipStatus;
};

/**
 * Adds a membership to a tenant (generic helper).
 * Used for: invite acceptance, bootstrap, etc.
 */
export async function addMemberToTenant(input: CreateMembershipInput): Promise<MembershipDoc> {
  return createMembershipRepo({
    tenantId: input.tenantId,
    userId: input.userId,
    role: input.role,
    status: input.status ?? "active",
  });
}

/**
 * Get active membership by tenant and user (RBAC helper).
 * Used by guards: requireTenantMembership, requireTenantRole.
 */
export async function getMembership(
  tenantId: Types.ObjectId,
  userId: Types.ObjectId
): Promise<MembershipDoc | null> {
  return getActiveMembershipByTenantAndUser({ tenantId, userId });
}

/**
 * NOTE:
 * Your existing service had listMembershipsForTenant/listMembershipsForUser/update/remove helpers,
 * but they are not present in the repo code you shared for this merge.
 * So we keep the file minimal + safe, without inventing missing repo functions.
 *
 * If you paste your full repo file containing those list/update/remove functions,
 * I can merge them back here too.
 */

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
  const existing = await findMembershipByTenantAndUser(input.tenantId, input.userId);
  if (existing) return false;

  await createMembershipRepo({
    tenantId: input.tenantId,
    userId: input.userId,
    role: input.role,
    status: input.status ?? "active",
  });

  return true;
}

/* =========================================================
   Feature #3 — Assign Tenant Admins (Platform Admin only)
   ========================================================= */

type AssignTenantAdminInput = {
  tenantId: Types.ObjectId;
  email: string;
  performedByUserId: Types.ObjectId; // platform admin user id
};

export async function assignTenantAdminService(input: AssignTenantAdminInput) {
  const { tenantId, email, performedByUserId } = input;

  // 1) Find tenant
  const tenant = await Tenant.findById(tenantId);
  if (!tenant || tenant.isArchived) {
    const err = new Error("Tenant not found or archived");
    // @ts-expect-error attach status for errorHandler
    err.status = 404;
    throw err;
  }

  // 2) Find user by email
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const err = new Error("User not found");
    // @ts-expect-error attach status for errorHandler
    err.status = 404;
    throw err;
  }

  // 3) Upsert membership (tenantAdmin + active)
  const membership = await upsertTenantAdminMembership(
    tenant._id as Types.ObjectId,
    user._id as Types.ObjectId
  );

  // 4) Write audit log
  await AuditLog.create({
    tenantId: tenant._id,
    userId: user._id,
    action: "TENANT_ADMIN_ASSIGNED",
    performedByUserId,
    createdAt: new Date(),
    metadata: {
      assignedRole: "tenantAdmin",
      assignedStatus: "active",
      targetEmail: normalizedEmail,
    },
  });

  return membership;
}
