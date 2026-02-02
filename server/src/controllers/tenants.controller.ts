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
    deletedAt: t.deletedAt ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

function isDuplicateSlugError(err: any): boolean {
  if (!err) return false;
  if (err.code === 11000) {
    if (err.keyPattern?.slug) return true;
    if (err.keyValue?.slug) return true;
  }
  return false;
}

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
    if (isDuplicateSlugError(err) || err?.message === "SLUG_TAKEN") {
      return res.status(409).json({ code: "SLUG_TAKEN", message: "Tenant slug already exists" });
    }
    return next(err);
  }
}

/**
 * Platform Admin only
 * GET /api/platform/tenants
 * Supports: ?page=1&q=test&includeArchived=false&limit=20
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

    const limit = parsed.data.limit ?? 20;

    // ✅ If page is used, compute offset from it (React Query plan)
    const offset =
      typeof parsed.data.page === "number"
        ? (parsed.data.page - 1) * limit
        : (parsed.data.offset ?? 0);

    const items = await listTenants({
      limit,
      offset,
      q: parsed.data.q,
      includeArchived: parsed.data.includeArchived ?? false,
      includeDeleted: parsed.data.includeDeleted ?? false,
    });

    return res.status(200).json({
      items: items.map(toTenantResponse),
      page: parsed.data.page ?? undefined,
      limit,
    });
  } catch (err) {
    return next(err);
  }
}

// getTenantDetailsHandler, setTenantSuspendedHandler, softDeleteTenantHandler unchanged...


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
