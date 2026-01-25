// FILE: server/src/services/rbac.service.ts
import { type Types } from "mongoose";
import { getActiveMembershipByTenantAndUser } from "../repositories/memberships.repo";

export type TenantRole = "tenantAdmin" | "member";

export type ActiveMembership = {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  role: TenantRole;
};

/**
 * Phase 5 RBAC helper:
 * Returns active membership for (tenantId, userId) or null.
 * Source of truth: Membership collection.
 */
export async function getActiveMembershipForTenant(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
}): Promise<ActiveMembership | null> {
  const membership = await getActiveMembershipByTenantAndUser({
    tenantId: input.tenantId,
    userId: input.userId,
  });

  if (!membership) return null;

  // Defensive: ensure role is one of allowed roles
  const role = membership.role as TenantRole;
  if (role !== "tenantAdmin" && role !== "member") return null;

  return {
    tenantId: membership.tenantId as unknown as Types.ObjectId,
    userId: membership.userId as unknown as Types.ObjectId,
    role,
  };
}
