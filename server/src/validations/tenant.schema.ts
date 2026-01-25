// FILE: server/src/validations/tenant.schema.ts
import mongoose from "mongoose";
import { z } from "zod";

const objectIdString = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v), { message: "Invalid ObjectId" });

/**
 * Platform (Tenants module)
 */
export const PlatformListTenantsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  includeArchived: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  includeDeleted: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
});

export const PlatformTenantIdParamSchema = z.object({
  tenantId: objectIdString,
});

export const PlatformSetTenantSuspendedBodySchema = z.object({
  // We keep "suspend" semantics mapped to isArchived for Phase 4 compatibility.
  suspended: z.boolean(),
});

export const PlatformSoftDeleteTenantBodySchema = z
  .object({
    // optional reason for audit/logging later
    reason: z.string().trim().max(500).optional(),
  })
  .optional();
