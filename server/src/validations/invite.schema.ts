// FILE: server/src/validations/invite.schema.ts
import { z } from "zod";

const objectIdMsg = "Invalid ObjectId";

export const inviteParamsSchema = z.object({
  tenantId: z.string().min(1).regex(/^[0-9a-fA-F]{24}$/, objectIdMsg),
});

export const inviteIdParamsSchema = z.object({
  tenantId: z.string().min(1).regex(/^[0-9a-fA-F]{24}$/, objectIdMsg),
  inviteId: z.string().min(1).regex(/^[0-9a-fA-F]{24}$/, objectIdMsg),
});

export const createInviteBodySchema = z.object({
  email: z.string().trim().email("Invalid email").transform((v) => v.toLowerCase()),
  role: z.enum(["tenantAdmin", "member"]).optional().default("member"),
});

// ✅ Backward-compatible export name (some files use inviteBodySchema)
export const inviteBodySchema = createInviteBodySchema;

export type CreateInviteBody = z.infer<typeof createInviteBodySchema>;
