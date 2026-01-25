// FILE: server/src/controllers/tenants.controller.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import {
  PlatformListTenantsQuerySchema,
  PlatformSetTenantSuspendedBodySchema,
  PlatformTenantIdParamSchema,
} from "../validations/tenant.schema";
import {
  getTenantById,
  listTenants,
  setTenantSuspended,
  softDeleteTenant,
} from "../services/tenants.service";

function toTenantResponse(t: any) {
  return {
    id: String(t._id),
    name: t.name,
    slug: t.slug,
    logoUrl: t.logoUrl ?? "",
    isArchived: Boolean(t.isArchived),
    deletedAt: t.deletedAt ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

/**
 * Platform Admin only
 * GET /api/platform/tenants
 */
export async function listAllTenantsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = PlatformListTenantsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid query",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const items = await listTenants({
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      includeArchived: parsed.data.includeArchived ?? false,
      includeDeleted: parsed.data.includeDeleted ?? false,
    });

    return res.status(200).json({ items: items.map(toTenantResponse) });
  } catch (err) {
    return next(err);
  }
}

/**
 * Platform Admin only
 * GET /api/platform/tenants/:tenantId
 */
export async function getTenantDetailsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsedParams = PlatformTenantIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: parsedParams.error.flatten().fieldErrors,
      });
    }

    const tenantId = new mongoose.Types.ObjectId(
      parsedParams.data.tenantId
    ) as Types.ObjectId;

    const tenant = await getTenantById(tenantId);

    // Prefer 404 to avoid existence leaks
    if (!tenant) {
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    return res.status(200).json({ item: toTenantResponse(tenant) });
  } catch (err) {
    return next(err);
  }
}

/**
 * Platform Admin only
 * PATCH /api/platform/tenants/:tenantId/suspend
 * Body: { suspended: boolean }
 *
 * Note: suspension maps to Tenant.isArchived to preserve Phase 4 behavior.
 */
export async function setTenantSuspendedHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsedParams = PlatformTenantIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: parsedParams.error.flatten().fieldErrors,
      });
    }

    const parsedBody = PlatformSetTenantSuspendedBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid body",
        fieldErrors: parsedBody.error.flatten().fieldErrors,
      });
    }

    const tenantId = new mongoose.Types.ObjectId(
      parsedParams.data.tenantId
    ) as Types.ObjectId;

    const updated = await setTenantSuspended({
      tenantId,
      suspended: parsedBody.data.suspended,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    return res.status(200).json({ item: toTenantResponse(updated) });
  } catch (err) {
    return next(err);
  }
}

/**
 * Platform Admin only
 * DELETE /api/platform/tenants/:tenantId
 * Soft delete: sets deletedAt + deletedByUserId and makes tenant inactive.
 */
export async function softDeleteTenantHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsedParams = PlatformTenantIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: parsedParams.error.flatten().fieldErrors,
      });
    }

    const actorId = req.user?._id;
    if (!actorId || !mongoose.isValidObjectId(String(actorId))) {
      return res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const tenantId = new mongoose.Types.ObjectId(
      parsedParams.data.tenantId
    ) as Types.ObjectId;

    const deletedByUserId = new mongoose.Types.ObjectId(
      String(actorId)
    ) as Types.ObjectId;

    const updated = await softDeleteTenant({ tenantId, deletedByUserId });

    if (!updated) {
      return res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    return res.status(200).json({ item: toTenantResponse(updated) });
  } catch (err) {
    return next(err);
  }
}
