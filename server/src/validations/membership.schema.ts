// FILE: server/src/validations/membership.schema.ts
import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine((val) => mongoose.isValidObjectId(val), {
  message: "Invalid ObjectId",
});

export const assignTenantAdminParamsSchema = z.object({
  tenantId: objectId,
});

export const assignTenantAdminBodySchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

export type AssignTenantAdminParams = z.infer<typeof assignTenantAdminParamsSchema>;
export type AssignTenantAdminBody = z.infer<typeof assignTenantAdminBodySchema>;
