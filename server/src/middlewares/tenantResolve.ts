// FILE: server/src/middlewares/tenantResolve.ts
import type { Request, Response, NextFunction } from "express";
import { connectDB } from "../db/connect";
import Tenant from "../models/Tenant";

/**
 * Phase 2 (passive resolver):
 * - Resolve tenant by slug from ONE standard source:
 *   ✅ Header: `x-tenant-slug`
 * - Attach result to req.tenant (no auth/RBAC enforcement here).
 *
 * Later (Phase 3+):
 * - you can enforce membership + role checks in separate guards.
 */
export async function tenantResolve(req: Request, _res: Response, next: NextFunction) {
  try {
    const rawSlug = req.header("x-tenant-slug")?.trim().toLowerCase() ?? "";

    // Passive: if header missing, just continue (no blocking yet)
    if (!rawSlug) {
      req.tenant = null;
      return next();
    }

    await connectDB();

    // NOTE:
    // Your current Tenant model has: { slug, isArchived }
    // Old Next.js code had tenant.status "active/suspended".
    // For MERN Phase-2: treat isArchived=true as "inactive".
    const tenant = await Tenant.findOne({ slug: rawSlug, isArchived: false }).exec();

    if (!tenant) {
      // Passive: attach null and continue (no blocking yet)
      req.tenant = null;
      return next();
    }

    req.tenant = {
      tenantId: tenant._id,
      slug: tenant.slug,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}
