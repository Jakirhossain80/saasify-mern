// FILE: server/src/middlewares/tenantResolve.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { Tenant } from "../models/Tenant";

/**
 * ✅ Tenant resolver (supports BOTH styles) — merged safely
 *
 * Supports:
 * 1) NEW style (Phase 8+):    /api/tenant/:tenantId/...   -> resolve by tenantId
 * 2) Current slug style:      /api/t/:tenantSlug/...      -> resolve by tenantSlug
 * 3) Legacy/optional header:  x-tenant-slug               -> fallback (passive)
 *
 * Attaches (when resolved):
 *   req.tenantId   (Types.ObjectId)
 *   req.tenantSlug (string)
 *   req.tenant     ({ tenantId, slug } | null)
 *
 * Behavior:
 * - If tenantId param exists -> validate + must resolve (400/404 on failure)
 * - Else if tenantSlug param or header exists -> must resolve (404 on failure)
 * - Else -> passive (req.tenant = null, continue)
 *
 * NOTE:
 * - For routes that REQUIRE tenant (like invites/members), you should ensure
 *   you pass either tenantId param or tenantSlug param; otherwise this stays passive.
 */
export async function tenantResolve(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantIdParam = String(req.params?.tenantId ?? "").trim();
    const tenantSlugParam = String(req.params?.tenantSlug ?? "").trim().toLowerCase();
    const tenantSlugHeader = String(req.header("x-tenant-slug") ?? "").trim().toLowerCase();

    // ------------------------------------------------------------
    // 1) Prefer tenantId param if present (strict)
    // ------------------------------------------------------------
    if (tenantIdParam) {
      if (!mongoose.isValidObjectId(tenantIdParam)) {
        return res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Invalid tenantId",
        });
      }

      await connectDB();

      const tenant = await Tenant.findOne({ _id: tenantIdParam, isArchived: false }).exec();
      if (!tenant) {
        return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
      }

      req.tenantId = tenant._id as unknown as Types.ObjectId;
      req.tenantSlug = tenant.slug;
      req.tenant = { tenantId: tenant._id, slug: tenant.slug };

      return next();
    }

    // ------------------------------------------------------------
    // 2) Else resolve by slug param or header
    //    - If slug exists, it's strict (404 if not found)
    //    - If no slug at all, stay passive (Phase 2 behavior)
    // ------------------------------------------------------------
    const slug = tenantSlugParam || tenantSlugHeader;

    if (!slug) {
      // ✅ Passive: routes not needing tenant can continue
      req.tenant = null;
      return next();
    }

    await connectDB();

    const tenant = await Tenant.findOne({ slug, isArchived: false }).exec();
    if (!tenant) {
      // If caller supplied a slug (param or header), treat it as required context
      req.tenant = null;
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

    req.tenantId = tenant._id as unknown as Types.ObjectId;
    req.tenantSlug = tenant.slug;
    req.tenant = { tenantId: tenant._id, slug: tenant.slug };

    return next();
  } catch (err) {
    return next(err);
  }
}
