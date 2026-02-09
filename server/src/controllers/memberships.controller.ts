// FILE: server/src/controllers/memberships.controller.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";

import { connectDB } from "../db/connect";
import { Membership } from "../models/Membership";
import { User } from "../models/User";
import { Tenant } from "../models/Tenant";

import {
  assignTenantAdminParamsSchema,
  assignTenantAdminBodySchema,
  tenantIdParamSchema,
  memberParamsSchema,
  patchMemberRoleBodySchema,
} from "../validations/membership.schema";

import {
  listTenantMembersService,
  updateTenantMemberRoleService,
  removeTenantMemberService,
} from "../services/memberships.service";

/* =========================================================
   Phase 5 (legacy/minimal) — Keep existing behavior
   NOTE: Some older tenant routes may still use this handler name.
   ========================================================= */

/**
 * Phase 5 (minimal):
 * List tenant members (admin-only route in tenant.routes.ts)
 * - Requires: requireAuth + resolveTenant/tenantResolve + requireTenantMembership already ran
 * - Route guard should enforce tenantAdmin; this handler just returns scoped data.
 */
export async function listTenantMembersHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // resolveTenant/tenantResolve should set req.tenantId (Types.ObjectId)
    const tenantId = req.tenantId as Types.ObjectId | undefined;

    if (!tenantId || !mongoose.isValidObjectId(String(tenantId))) {
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

/* =========================================================
   Feature #3 (platform-only) — Keep existing behavior
   ========================================================= */

/**
 * ✅ Feature #3 (platform-only):
 * Assign or update Tenant Admin by upserting Membership record.
 *
 * POST /api/platform/tenants/:tenantId/admins
 * body: { email }
 *
 * Route protection must be:
 * requireAuth + requirePlatformAdmin
 */
export async function assignTenantAdminController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // ✅ Validate tenantId param (safe, no throw)
    const paramsParsed = assignTenantAdminParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: paramsParsed.error.flatten().fieldErrors,
      });
    }

    // ✅ Validate body (safe, no throw)
    const bodyParsed = assignTenantAdminBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        fieldErrors: bodyParsed.error.flatten().fieldErrors,
      });
    }

    /**
     * ✅ CRITICAL:
     * Your requireAuth middleware sets:
     *   req.user = { userId, email, platformRole }
     * Some older code may still set: req.user = { id: ... }
     * Support BOTH to prevent "Unauthorized" + 500.
     */
    const performedByUserId = (req.user as any)?.userId ?? (req.user as any)?.id ?? null;

    if (!performedByUserId || !mongoose.isValidObjectId(String(performedByUserId))) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    await connectDB();

    const tenantId = new mongoose.Types.ObjectId(paramsParsed.data.tenantId);
    const email = String(bodyParsed.data.email).trim().toLowerCase();

    // ✅ Ensure tenant exists
    const tenant = await Tenant.findById(tenantId).lean();
    if (!tenant) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    // ✅ Optional: block assigning admin to archived tenant
    if ((tenant as any).isArchived === true) {
      return res.status(409).json({
        code: "TENANT_ARCHIVED",
        message: "Tenant is archived. Unarchive it first.",
      });
    }

    // ✅ Find user by email (must exist first via SignUp)
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({
        code: "USER_NOT_FOUND",
        message: "User not found with this email. Ask the user to register first.",
      });
    }

    const userId = new mongoose.Types.ObjectId(String((user as any)._id));

    // ✅ Upsert membership (unique index on tenantId + userId recommended)
    const membership = await Membership.findOneAndUpdate(
      { tenantId, userId },
      {
        $set: {
          role: "tenantAdmin", // ✅ camelCase convention
          status: "active",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      ok: true,
      message: "Tenant admin assigned",
      membership: {
        id: membership._id.toString(),
        tenantId: membership.tenantId.toString(),
        userId: membership.userId.toString(),
        role: membership.role,
        status: membership.status,
      },
    });
  } catch (err) {
    return next(err);
  }
}

/* =========================================================
   Tenant helper — Keep existing behavior
   ========================================================= */

/**
 * Tenant helper:
 * GET /api/t/:tenantSlug/me
 * - requireAuth + resolveTenant + requireTenantMembership already ran
 * - Returns tenant context + your role in this tenant
 */
export async function getMyTenantContextHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // resolveTenant should set these
    const tenantId = (req as any).tenantId as Types.ObjectId | undefined;
    const tenantSlug = (req as any).tenantSlug as string | undefined;

    if (!tenantId || !tenantSlug) {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

    // requireTenantMembership attaches this in your middleware
    const tenantRole = (req as any).tenantRole as "tenantAdmin" | "member" | undefined;

    if (!tenantRole) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Forbidden" });
    }

    return res.status(200).json({
      tenant: {
        id: String(tenantId),
        slug: tenantSlug,
      },
      role: tenantRole,
    });
  } catch (err) {
    return next(err);
  }
}

/* =========================================================
   Phase 8 (2) — Members Management (Tenant Admin)
   New handlers (service-driven, Postman-friendly)
   ========================================================= */

/**
 * GET /api/tenant/:tenantId/members
 * Response: { items: [...] }
 */
export async function listTenantMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = tenantIdParamSchema.parse(req.params);
    const result = await listTenantMembersService(tenantId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/tenant/:tenantId/members/:userId
 * body: { role: "tenantAdmin" | "member" }
 * Response: { membership: {...} }
 */
export async function updateTenantMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId, userId } = memberParamsSchema.parse(req.params);
    const body = patchMemberRoleBodySchema.parse(req.body);

    // Support both shapes: req.user.userId and req.user.id / req.user._id
    const actorUserId =
      (req.user as any)?.userId ??
      (req.user as any)?.id ??
      (req.user as any)?._id ??
      undefined;

    const result = await updateTenantMemberRoleService({
      tenantId,
      targetUserId: userId,
      role: body.role,
      actorUserId,
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/tenant/:tenantId/members/:userId
 * Response: { ok:true, userId, status:"removed" }
 */
export async function removeTenantMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId, userId } = memberParamsSchema.parse(req.params);

    const actorUserId =
      (req.user as any)?.userId ??
      (req.user as any)?.id ??
      (req.user as any)?._id ??
      undefined;

    const result = await removeTenantMemberService({
      tenantId,
      targetUserId: userId,
      actorUserId,
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}
