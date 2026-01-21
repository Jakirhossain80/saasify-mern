// FILE: server/src/validations/common.schema.ts
import { z } from "zod";

export const NonEmptyString = z.string().trim().min(1, { message: "Required" });

export const OptionalTrimmedString = z.string().trim().optional();

export const ObjectIdString = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, { message: "Invalid id" });

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(12),
  offset: z.coerce.number().int().min(0).default(0),
});

export const SearchSchema = z.object({
  search: z.string().trim().max(200).optional(),
});

export const SortDirectionSchema = z.enum(["asc", "desc"]).default("desc");

export const DateRangeSchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine(
    (v) => {
      if (!v.from || !v.to) return true;
      return v.from.getTime() <= v.to.getTime();
    },
    { message: "`from` must be before `to`" }
  );

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.array(z.string())).optional(),
});

export type ApiErrorShape = z.infer<typeof ApiErrorSchema>;
export type FieldErrors = Record<string, string[]>;

export function toFieldErrors(issues: z.ZodIssue[]): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = [];
    out[key].push(issue.message);
  }
  return out;
}
