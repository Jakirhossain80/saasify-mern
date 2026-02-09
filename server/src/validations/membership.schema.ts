// FILE: server/src/validations/membership.schema.ts
import { z } from "zod";
import mongoose from "mongoose";

/**
 * ✅ Shared ObjectId validator (string)
 * - Keeps existing behavior (Invalid ObjectId message)
 * - Adds a basic required check for safety
 */
const objectId = z
  .string()
  .min(1, "Required")
  .refine((val) => mongoose.isValidObjectId(val), {
    message: "Invalid ObjectId",
  });

/* =========================================
   Existing: Assign Tenant Admin (kept as-is)
   ========================================= */

export const assignTenantAdminParamsSchema = z.object({
  tenantId: objectId,
});

export const assignTenantAdminBodySchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

export type AssignTenantAdminParams = z.infer<typeof assignTenantAdminParamsSchema>;
export type AssignTenantAdminBody = z.infer<typeof assignTenantAdminBodySchema>;

/* =========================================
   New: Members Management (added safely)
   ========================================= */

export const memberParamsSchema = z.object({
  tenantId: objectId,
  userId: objectId,
});

export const tenantIdParamSchema = z.object({
  tenantId: objectId,
});

export const patchMemberRoleBodySchema = z
  .object({
    role: z.enum(["tenantAdmin", "member"]),
  })
  .strict(); // ✅ Reject unknown keys
