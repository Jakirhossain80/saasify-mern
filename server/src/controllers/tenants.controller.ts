// FILE: server/src/controllers/tenants.controller.ts
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { listTenants } from "../services/tenants.service";

const ListTenantsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  includeArchived: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
});

/**
 * Platform Admin only (Phase 5)
 * GET /api/platform/tenants
 */
export async function listAllTenantsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = ListTenantsQuerySchema.safeParse(req.query);
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
    });

    return res.status(200).json({
      items: items.map((t) => ({
        id: String(t._id),
        name: t.name,
        slug: t.slug,
        logoUrl: t.logoUrl ?? "",
        isArchived: Boolean(t.isArchived),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (err) {
    return next(err);
  }
}
