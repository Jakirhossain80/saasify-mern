// FILE: server/src/services/memberships.service.ts
import type { Types } from "mongoose";
import type { MembershipDoc, MembershipRole } from "../models/Membership";
import { Membership } from "../models/Membership"; // ✅ ADD (safe minimal)
import { Tenant } from "../models/Tenant";
import { User } from "../models/User";
import { AuditLog } from "../models/AuditLog";
import {
  createMembershipRepo,
  getActiveMembershipByTenantAndUser,
  findMembershipByTenantAndUser,
  upsertTenantAdminMembership,
  // Phase 8 (2) repos:
  listMembersByTenantRepo,
  findActiveMembershipRepo,
  updateMemberRoleRepo,
  removeMemberRepo,
  countActiveTenantAdminsRepo,
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
 * Helper used by invites flow.
 * - If membership doesn't exist: create it.
 * - If membership exists but not active (removed/legacy): re-activate it.
 * Returns true only when created OR re-activated.
 */
export async function addMembershipIfNotExists(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MembershipRole;
  status?: MembershipStatus;
}): Promise<boolean> {
  const existing: any = await findMembershipByTenantAndUser(input.tenantId, input.userId);

  // ✅ If already exists and is active, nothing to do
  if (existing && String(existing.status) === "active") {
    return false;
  }

  // ✅ If exists but not active (removed/legacy pending/invited), reactivate it
  if (existing) {
    await Membership.findOneAndUpdate(
      { tenantId: input.tenantId, userId: input.userId },
      {
        $set: {
          role: input.role,
          status: input.status ?? "active",
        },
      },
      { new: true }
    ).exec();

    return true;
  }

  // ✅ Otherwise create fresh membership
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
    const err = new Error("Tenant not found or archived") as Error & { status?: number };
    err.status = 404;
    throw err;
  }

  // 2) Find user by email
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const err = new Error("User not found") as Error & { status?: number };
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

/* =========================================================
   Phase 8 (2) — Members Management (Tenant Admin)
   ========================================================= */

type Role = "tenantAdmin" | "member";

function makeError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

export async function listTenantMembersService(tenantId: string) {
  const items = await listMembersByTenantRepo(tenantId);
  return { items };
}

export async function updateTenantMemberRoleService(opts: {
  tenantId: string;
  targetUserId: string;
  role: Role;
  actorUserId?: string;
}) {
  const { tenantId, targetUserId, role, actorUserId } = opts;

  const targetMembership = await findActiveMembershipRepo(tenantId, targetUserId);
  if (!targetMembership) throw makeError(404, "Membership not found (active).");

  const isDemotingAdmin = targetMembership.role === "tenantAdmin" && role === "member";
  if (isDemotingAdmin) {
    const adminsCount = await countActiveTenantAdminsRepo(tenantId);
    if (adminsCount <= 1) {
      throw makeError(400, "Cannot demote the last active tenantAdmin of this tenant.");
    }
  }

  if (actorUserId && actorUserId === targetUserId && isDemotingAdmin) {
    const adminsCount = await countActiveTenantAdminsRepo(tenantId);
    if (adminsCount <= 1) {
      throw makeError(400, "You cannot demote yourself because you are the last active tenantAdmin.");
    }
  }

  const updated = await updateMemberRoleRepo(tenantId, targetUserId, role);
  if (!updated) throw makeError(404, "Membership not found or not active.");

  return { membership: updated };
}

export async function removeTenantMemberService(opts: {
  tenantId: string;
  targetUserId: string;
  actorUserId?: string;
}) {
  const { tenantId, targetUserId, actorUserId } = opts;

  const targetMembership = await findActiveMembershipRepo(tenantId, targetUserId);
  if (!targetMembership) throw makeError(404, "Membership not found (active).");

  const removingAdmin = targetMembership.role === "tenantAdmin";
  if (removingAdmin) {
    const adminsCount = await countActiveTenantAdminsRepo(tenantId);
    if (adminsCount <= 1) {
      throw makeError(400, "Cannot remove the last active tenantAdmin of this tenant.");
    }
  }

  if (actorUserId && actorUserId === targetUserId && removingAdmin) {
    const adminsCount = await countActiveTenantAdminsRepo(tenantId);
    if (adminsCount <= 1) {
      throw makeError(400, "You cannot remove yourself because you are the last active tenantAdmin.");
    }
  }

  const updated = await removeMemberRepo(tenantId, targetUserId);
  if (!updated) throw makeError(404, "Membership not found or not active.");

  return { ok: true, userId: targetUserId, status: "removed" as const };
}