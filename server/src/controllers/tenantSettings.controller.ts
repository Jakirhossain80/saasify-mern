// FILE: server/src/controllers/tenantSettings.controller.ts
import type { Request, Response, NextFunction } from "express";
import { tenantIdParamSchema, tenantSettingsUpdateSchema } from "../validations/tenant.schema";
import { getTenantSettings, updateTenantSettings } from "../services/tenants.service";

function toTenantResponse(t: any) {
  return {
    id: String(t._id ?? t.id),
    name: t.name,
    slug: t.slug,
    logoUrl: t.logoUrl ?? undefined,
    isArchived: Boolean(t.isArchived),
  };
}

// GET /api/tenant/:tenantId/settings
export async function getTenantSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedParams = tenantIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({ message: "Invalid tenantId" });
    }

    const { tenantId } = parsedParams.data;
    const tenant = await getTenantSettings(tenantId);

    return res.json({ tenant: toTenantResponse(tenant) });
  } catch (err) {
    return next(err);
  }
}

// PATCH /api/tenant/:tenantId/settings
export async function patchTenantSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsedParams = tenantIdParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
      return res.status(400).json({ message: "Invalid tenantId" });
    }

    const parsedBody = tenantSettingsUpdateSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsedBody.error.flatten(),
      });
    }

    const { tenantId } = parsedParams.data;
    const tenant = await updateTenantSettings(tenantId, parsedBody.data);

    return res.json({ tenant: toTenantResponse(tenant) });
  } catch (err) {
    return next(err);
  }
}
