// FILE: server/src/middlewares/requireTenantMembership.ts
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
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
    const userId = req.user?.userId;

    if (!tenantId || !userId || !mongoose.isValidObjectId(userId)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);

    const membership = await getActiveMembershipForTenant({ tenantId, userId: userIdObj });
    if (!membership) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }

    // Store role for downstream checks (requireTenantRole)
    (req as Request & { tenantRole?: "tenantAdmin" | "member" }).tenantRole = membership.role;

    return next();
  } catch {
    return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
  }
}
