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

  // ✅ Feature #2 service functions
  setTenantArchived,
  safeDeleteTenant,
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
 * Note: suspension maps to Tenant.isArchived (legacy naming)
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

    const actorUserId = req.user?.userId;
    const actorObjId =
      actorUserId && mongoose.isValidObjectId(String(actorUserId))
        ? (new mongoose.Types.ObjectId(String(actorUserId)) as Types.ObjectId)
        : null;

    const tenantId = new mongoose.Types.ObjectId(parsedParams.data.tenantId) as Types.ObjectId;

    const updated = await setTenantSuspended({
      tenantId,
      suspended: parsedBody.data.suspended,
      actorUserId: actorObjId,
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

    // ✅ requireAuth sets req.user.userId
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

/* =========================================================
   ✅ Feature #2: Archive / Unarchive / Safe Delete (Hard)
   ========================================================= */

/**
 * Platform Admin only
 * PATCH /api/platform/tenants/:tenantId/archive
 */
export async function archiveTenantHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedParams = PlatformTenantIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: parsedParams.error.flatten().fieldErrors,
      });
    }

    const actorUserId = req.user?.userId;
    if (!actorUserId || !mongoose.isValidObjectId(String(actorUserId))) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const tenantId = new mongoose.Types.ObjectId(parsedParams.data.tenantId) as Types.ObjectId;

    const updated = await setTenantArchived({
      tenantId,
      isArchived: true,
      actorUserId: new mongoose.Types.ObjectId(String(actorUserId)) as Types.ObjectId,
    });

    if (!updated) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    return res.status(200).json({
      ok: true,
      tenantId: String(updated._id),
      isArchived: true,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Platform Admin only
 * PATCH /api/platform/tenants/:tenantId/unarchive
 */
export async function unarchiveTenantHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedParams = PlatformTenantIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: parsedParams.error.flatten().fieldErrors,
      });
    }

    const actorUserId = req.user?.userId;
    if (!actorUserId || !mongoose.isValidObjectId(String(actorUserId))) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const tenantId = new mongoose.Types.ObjectId(parsedParams.data.tenantId) as Types.ObjectId;

    const updated = await setTenantArchived({
      tenantId,
      isArchived: false,
      actorUserId: new mongoose.Types.ObjectId(String(actorUserId)) as Types.ObjectId,
    });

    if (!updated) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    return res.status(200).json({
      ok: true,
      tenantId: String(updated._id),
      isArchived: false,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Platform Admin only
 * DELETE /api/platform/tenants/:tenantId/hard
 * Safe hard delete: only if no projects and no memberships
 */
export async function safeDeleteTenantHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedParams = PlatformTenantIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: parsedParams.error.flatten().fieldErrors,
      });
    }

    const actorUserId = req.user?.userId;
    if (!actorUserId || !mongoose.isValidObjectId(String(actorUserId))) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const tenantId = new mongoose.Types.ObjectId(parsedParams.data.tenantId) as Types.ObjectId;

    const result = await safeDeleteTenant({
      tenantId,
      actorUserId: new mongoose.Types.ObjectId(String(actorUserId)) as Types.ObjectId,
    });

    if (!result) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Tenant not found" });
    }

    if (!result.ok) {
      const message =
        result.reason === "HAS_PROJECTS"
          ? "Cannot delete tenant: tenant has projects"
          : result.reason === "HAS_MEMBERSHIPS"
          ? "Cannot delete tenant: tenant has memberships"
          : "Cannot delete tenant: missing dependencies (Project/Membership models not wired)";

      return res.status(409).json({
        code: "DELETE_NOT_ALLOWED",
        message,
        reason: result.reason,
      });
    }

    return res.status(200).json({ ok: true, tenantId: String(tenantId) });
  } catch (err) {
    return next(err);
  }
}
