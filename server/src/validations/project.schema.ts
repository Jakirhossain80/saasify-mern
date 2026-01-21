// FILE: server/src/validations/project.schema.ts
import { z } from "zod";
import {
  NonEmptyString,
  OptionalTrimmedString,
  PaginationSchema,
  SearchSchema,
} from "./common.schema";

export const ProjectStatusSchema = z.enum(["active", "archived"]);

export const CreateProjectSchema = z.object({
  title: NonEmptyString.max(120, { message: "Title is too long" }),
  description: OptionalTrimmedString.transform((v) => v ?? "")
    .refine((v) => v.length <= 2000, { message: "Description is too long" })
    .optional(),
});

export const UpdateProjectSchema = z
  .object({
    title: NonEmptyString.max(120, { message: "Title is too long" }).optional(),
    description: z
      .string()
      .trim()
      .max(2000, { message: "Description is too long" })
      .optional(),
    status: ProjectStatusSchema.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field is required",
  });

export const ListProjectsQuerySchema = PaginationSchema.merge(SearchSchema).merge(
  z.object({
    status: ProjectStatusSchema.optional(),
  })
);

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof ListProjectsQuerySchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
