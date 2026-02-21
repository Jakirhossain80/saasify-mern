// FILE: server/src/middlewares/requireTenantMembership.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import { getActiveMembershipForTenant } from "../services/rbac.service";

/**
 * Requires active membership in req.tenantId for the authenticated user.
 * Returns 403 if tenant exists but user isn't allowed (no membership).
 */
export async function requireTenantMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantIdRaw: any = (req as any).tenantId;
    const userIdRaw: any = (req.user as any)?.userId ?? (req.user as any)?.id ?? (req.user as any)?._id ?? null;

    if (!tenantIdRaw || !userIdRaw) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }

    // ✅ Normalize tenantId into ObjectId (important!)
    const tenantIdStr = String(tenantIdRaw);
    if (!mongoose.isValidObjectId(tenantIdStr)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }
    const tenantId = new mongoose.Types.ObjectId(tenantIdStr) as Types.ObjectId;

    // ✅ Normalize userId into ObjectId
    const userIdStr = String(userIdRaw);
    if (!mongoose.isValidObjectId(userIdStr)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }
    const userId = new mongoose.Types.ObjectId(userIdStr) as Types.ObjectId;

    const membership = await getActiveMembershipForTenant({ tenantId, userId });
    if (!membership) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }

    // ✅ Attach tenantRole for downstream middleware/controllers
    (req as Request & { tenantRole?: "tenantAdmin" | "member" }).tenantRole = membership.role;

    // ✅ (Optional but helpful) store normalized ObjectId back
    (req as any).tenantId = tenantId;

    return next();
  } catch (err) {
    return next(err);
  }
}