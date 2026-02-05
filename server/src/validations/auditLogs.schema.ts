// FILE: server/src/validations/auditLogs.schema.ts
import { z } from "zod";
import mongoose from "mongoose";

const objectId = z.string().refine((val) => mongoose.isValidObjectId(val), {
  message: "Invalid ObjectId",
});

// ✅ Accept number-like strings too (Express query params are strings)
const numberFromQuery = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v))
  .refine((n) => Number.isFinite(n), { message: "Must be a number" });

export const listAuditLogsQuerySchema = z.object({
  page: numberFromQuery.optional().default(1).transform((n) => Math.max(1, n)),
  limit: numberFromQuery
    .optional()
    .default(20)
    .transform((n) => Math.min(100, Math.max(1, n))),

  action: z.string().trim().min(1).optional(),
  tenantId: objectId.optional(),
  actorUserId: objectId.optional(),

  // optional MVP date range
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
