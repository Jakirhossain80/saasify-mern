// FILE: server/src/middlewares/requireTenantMembership.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import { getActiveMembershipForTenant } from "../services/rbac.service";

/**
 * Requires active membership in req.tenantId for the authenticated user.
 *
 * Response choice:
 * - 403 (Forbidden) because tenant is already resolved (Phase 4) and exists,
 *   but the user isn't allowed. Message stays generic to reduce leakiness.
 */
export async function requireTenantMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.tenantId;
    const userIdStr = req.user?.userId ?? null;

    if (!tenantId || !userIdStr) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }

    if (!mongoose.isValidObjectId(userIdStr)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }

    const userId = new mongoose.Types.ObjectId(userIdStr) as Types.ObjectId;

    const membership = await getActiveMembershipForTenant({ tenantId, userId });
    if (!membership) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }

    // If you have req.tenantRole typed in express.d.ts, assign directly:
    // req.tenantRole = membership.role;
    // Otherwise keep this minimal local attach:
    (req as Request & { tenantRole?: "tenantAdmin" | "member" }).tenantRole = membership.role;

    return next();
  } catch (err) {
    return next(err);
  }
}
