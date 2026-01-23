// FILE: server/src/middlewares/resolveTenant.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Tenant } from "../models/Tenant";

/**
 * Phase 4: Strict tenant resolution + isolation
 * - Resolve tenant from route param: /api/t/:tenantSlug/...
 * - Attach req.tenantId + req.tenantSlug
 * - If tenant not found OR archived → 404 (avoid leaking tenant existence/state)
 *
 * Notes:
 * - We intentionally do NOT return 403 here because the tenant context itself is part of the route.
 *   404 prevents confirming whether a tenant exists or is archived.
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  try {
    // Primary source (required for slug-based APIs)
    const slugFromParams = (req.params?.tenantSlug ?? "").trim().toLowerCase();

    // Optional fallback (useful for debugging tools; NOT the primary API contract)
    const slugFromHeader = (req.header("x-tenant-slug") ?? "").trim().toLowerCase();

    const tenantSlug = slugFromParams || slugFromHeader;

    if (!tenantSlug) {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

    await connectDB();

    // Prefer explicit isArchived filter (canonical in SaaSify)
    const tenant = await Tenant.findOne({ slug: tenantSlug, isArchived: false }).exec();

    if (!tenant) {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

    // Extra safety: validate _id before attaching
    if (!mongoose.isValidObjectId(tenant._id)) {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

    req.tenantId = tenant._id as unknown as Types.ObjectId;
    req.tenantSlug = tenant.slug;

    return next();
  } catch (err) {
    return next(err);
  }
}
