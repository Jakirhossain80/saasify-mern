// FILE: server/src/validations/tenant.schema.ts
import mongoose from "mongoose";
import { z } from "zod";

/**
 * Shared helper
 */
const objectIdString = z
  .string()
  .trim()
  .refine((v) => mongoose.isValidObjectId(v), { message: "Invalid ObjectId" });

/**
 * Platform (Tenants module)
 */

// ✅ Create Tenant schema (POST /api/platform/tenants)
export const PlatformCreateTenantBodySchema = z.object({
  name: z.string().trim().min(2).max(120),

  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and URL-friendly.")
    .transform((v) => v.toLowerCase()),

  // Keep existing behavior (optional + default "")
  logoUrl: z.string().trim().optional().default(""),
});

/**
 * ✅ List Tenants schema (GET /api/platform/tenants)
 * Supports both:
 * - React Query plan: ?page=1&q=test&includeArchived=false
 * - Classic: ?limit=20&offset=0
 */
export const PlatformListTenantsQuerySchema = z.object({
  // React Query plan inputs
  page: z.coerce.number().int().min(1).optional(),

  // q should be optional and safe for empty strings
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),

  // classic pagination support
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

// ✅ Keep: used by PATCH /api/platform/tenants/:tenantId/suspend
export const PlatformSetTenantSuspendedBodySchema = z.object({
  suspended: z.boolean(),
});

// ✅ Keep: used by DELETE /api/platform/tenants/:tenantId (safe delete optional)
export const PlatformSoftDeleteTenantBodySchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .optional();

/**
 * Tenant (Tenant Settings module)
 */

// ✅ Param validation: tenantId must be a valid ObjectId string
// (Tenant-scoped routes like /api/tenant/:tenantId/settings)
export const tenantIdParamSchema = z.object({
  tenantId: objectIdString,
});

/**
 * ✅ Tenant Settings Update (tenant-scoped)
 * Allows only:
 * - name?: string (min 2)
 * - logoUrl?: valid URL (optional)
 * - isArchived?: boolean (optional)
 *
 * NOTE: slug is intentionally NOT present => cannot be updated here.
 */
export const tenantSettingsUpdateSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    logoUrl: z.string().trim().url().optional(),
    isArchived: z.boolean().optional(),
  })
  .strict();
