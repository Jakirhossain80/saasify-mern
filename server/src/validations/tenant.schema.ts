// FILE: server/src/validations/tenant.schema.ts
import mongoose from "mongoose";
import { z } from "zod";

const objectIdString = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v), { message: "Invalid ObjectId" });

/**
 * Platform (Tenants module)
 */

// ✅ Create Tenant schema (POST /api/platform/tenants)
export const PlatformCreateTenantBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tenant name must be at least 2 characters")
    .max(120),

  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase and URL-friendly (a-z, 0-9, hyphen)."
    )
    .transform((v) => v.toLowerCase()),

  logoUrl: z.string().trim().optional().default(""),
});

export const PlatformListTenantsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  includeArchived: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined
    ),

  includeDeleted: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) =>
      v === "true" ? true : v === "false" ? false : undefined
    ),
});

export const PlatformTenantIdParamSchema = z.object({
  tenantId: objectIdString,
});

export const PlatformSetTenantSuspendedBodySchema = z.object({
  // Suspension maps to isArchived
  suspended: z.boolean(),
});

export const PlatformSoftDeleteTenantBodySchema = z
  .object({
    // Optional reason (future audit log)
    reason: z.string().trim().max(500).optional(),
  })
  .optional();
