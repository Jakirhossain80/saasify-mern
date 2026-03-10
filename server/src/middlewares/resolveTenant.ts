// FILE: server/src/middlewares/resolveTenant.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Tenant } from "../models/Tenant";

function normalizeToTrimmedLowerString(value: unknown): string {
  if (typeof value === "string") return value.trim().toLowerCase();
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim().toLowerCase();
  }
  return "";
}

/**
 * Phase 4: Strict tenant resolution + isolation
 * - Resolve tenant from route param: /api/t/:tenantSlug/...
 * - Attach req.tenantId + req.tenantSlug
 * - If tenant not found OR archived → 404
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const slugFromParams = normalizeToTrimmedLowerString(req.params?.tenantSlug);
    const slugFromHeader = normalizeToTrimmedLowerString(req.header("x-tenant-slug"));

    const tenantSlug = slugFromParams || slugFromHeader;

    if (!tenantSlug) {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

    await connectDB();

    const tenant = await Tenant.findOne({ slug: tenantSlug, isArchived: false }).exec();

    if (!tenant) {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

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
