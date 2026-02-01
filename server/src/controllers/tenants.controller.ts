// FILE: server/src/controllers/tenants.controller.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import {
  PlatformCreateTenantBodySchema,
  PlatformListTenantsQuerySchema,
  PlatformSetTenantSuspendedBodySchema,
  PlatformTenantIdParamSchema,
} from "../validations/tenant.schema";
import {
  createTenant,
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
    // keep compatible even if field doesn't exist in schema:
    deletedAt: t.deletedAt ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

// Helper: detect Mongo duplicate key for slug
function isDuplicateSlugError(err: any): boolean {
  if (!err) return false;
  // Mongo duplicate key error
  if (err.code === 11000) {
    // If keyPattern exists, prefer it
    if (err.keyPattern?.slug) return true;
    // Fallback: parse keyValue
    if (err.keyValue?.slug) return true;
  }
  return false;
}

/**
 * Platform Admin only
 * POST /api/platform/tenants
 * Body: { name, slug, logoUrl? }
 */
export async function createTenantHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedBody = PlatformCreateTenantBodySchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid body",
        fieldErrors: parsedBody.error.flatten().fieldErrors,
      });
    }

    // actorId comes from requireAuth -> req.user = { userId, email }
    const actorUserId = req.user?.userId;
    if (!actorUserId || !mongoose.isValidObjectId(String(actorUserId))) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const created = await createTenant({
      name: parsedBody.data.name,
      slug: parsedBody.data.slug,
      logoUrl: parsedBody.data.logoUrl ?? "",
      createdByUserId: new mongoose.Types.ObjectId(String(actorUserId)) as Types.ObjectId,
    });

    return res.status(201).json({ tenant: toTenantResponse(created) });
  } catch (err: any) {
    if (isDuplicateSlugError(err)) {
      return res.status(409).json({ code: "SLUG_TAKEN", message: "Tenant slug already exists" });
    }
    return next(err);
  }
}

/**
 * Platform Admin only
 * GET /api/platform/tenants
 */
export async function listAllTenantsHandler(req: Request, res: Response, next: NextFunction) {
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
export async function getTenantDetailsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedParams = PlatformTenantIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: parsedParams.error.flatten().fieldErrors,
      });
    }

    const tenantId = new mongoose.Types.ObjectId(parsedParams.data.tenantId) as Types.ObjectId;
    const tenant = await getTenantById(tenantId);

    if (!tenant) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Tenant not found" });
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
 * Note: suspension maps to Tenant.isArchived
 */
export async function setTenantSuspendedHandler(req: Request, res: Response, next: NextFunction) {
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

    const tenantId = new mongoose.Types.ObjectId(parsedParams.data.tenantId) as Types.ObjectId;

    const updated = await setTenantSuspended({
      tenantId,
      suspended: parsedBody.data.suspended,
    });

    if (!updated) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Tenant not found" });
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
export async function softDeleteTenantHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedParams = PlatformTenantIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: parsedParams.error.flatten().fieldErrors,
      });
    }

    // ✅ FIX: requireAuth sets req.user.userId (NOT req.user._id)
    const actorUserId = req.user?.userId;
    if (!actorUserId || !mongoose.isValidObjectId(String(actorUserId))) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const tenantId = new mongoose.Types.ObjectId(parsedParams.data.tenantId) as Types.ObjectId;
    const deletedByUserId = new mongoose.Types.ObjectId(String(actorUserId)) as Types.ObjectId;

    const updated = await softDeleteTenant({ tenantId, deletedByUserId });

    if (!updated) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    return res.status(200).json({ item: toTenantResponse(updated) });
  } catch (err) {
    return next(err);
  }
}
