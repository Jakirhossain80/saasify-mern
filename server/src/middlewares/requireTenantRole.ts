// FILE: server/src/middlewares/requireTenantRole.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import { getActiveMembershipByTenantAndUser } from "../repositories/memberships.repo";

export type TenantRole = "tenantAdmin" | "member";

/**
 * Phase 5: requireTenantRole
 * - Use after: requireAuth + resolveTenant + requireTenantMembership
 * - Defense-in-depth: re-check membership role for the tenant before admin-only actions
 */
export function requireTenantRole(allowedRoles: TenantRole[]) {
  return async function requireTenantRoleMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId;
      const userIdStr = req.user?.userId ?? null;

      if (!tenantId || !userIdStr) {
        return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
      }

      if (!mongoose.isValidObjectId(userIdStr)) {
        return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
      }

      const userId = new mongoose.Types.ObjectId(userIdStr) as Types.ObjectId;

      const membership = await getActiveMembershipByTenantAndUser({
        tenantId,
        userId,
      });

      if (!membership) {
        // Authenticated, but not a member of this tenant
        return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
      }

      if (!allowedRoles.includes(membership.role)) {
        // Member exists, but role isn't allowed for this route
        return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
