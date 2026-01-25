// FILE: server/src/controllers/memberships.controller.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Membership } from "../models/Membership";

/**
 * Phase 5 (minimal):
 * List tenant members (admin-only route in tenant.routes.ts)
 * - Requires: requireAuth + resolveTenant + requireTenantMembership already ran
 * - Route guard should enforce tenantAdmin; this handler just returns scoped data.
 */
export async function listTenantMembersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.tenantId as Types.ObjectId | undefined;

    if (!tenantId || !mongoose.isValidObjectId(String(tenantId))) {
      // Tenant context missing or invalid (shouldn't happen if resolveTenant ran)
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

    await connectDB();

    // ✅ Strict tenant isolation: always filter by tenantId
    const members = await Membership.find({ tenantId, status: "active" })
      .sort({ createdAt: -1 })
      .select({ _id: 1, userId: 1, role: 1, status: 1, createdAt: 1 })
      .lean()
      .exec();

    return res.status(200).json({
      items: members.map((m) => ({
        id: String(m._id),
        userId: String(m.userId),
        role: m.role,
        status: m.status,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    return next(err);
  }
}
