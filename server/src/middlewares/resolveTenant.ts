// FILE: server/src/middlewares/resolveTenant.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Tenant } from "../models/Tenant";

/**
 * Phase 4: Strict tenant resolution + isolation
 * - Resolve tenant from route param: /api/t/:tenantSlug/...
 * - Attach req.tenantId + req.tenantSlug
 * - If tenant not found or archived → 404 (preferred: do not leak tenant existence/state)
 */
export async function resolveTenant(req: Request, res: Response, next: NextFunction) {
  try {
    // Primary source (required for Phase-4 slug-based APIs)
    const slugFromParams = (req.params?.tenantSlug ?? "").trim().toLowerCase();

    // Optional fallback (useful for debugging tools, not the primary API contract)
    const slugFromHeader = (req.header("x-tenant-slug") ?? "").trim().toLowerCase();

    const tenantSlug = slugFromParams || slugFromHeader;

    if (!tenantSlug) {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

    await connectDB();

    const tenant = await Tenant.findOne({ slug: tenantSlug, isArchived: false }).exec();

    if (!tenant) {
      // 404 is intentional: prevents leaking whether a tenant exists or is archived
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

    req.tenantId = tenant._id as unknown as Types.ObjectId;
    req.tenantSlug = tenant.slug;

    return next();
  } catch (err) {
    return next(err);
  }
}
