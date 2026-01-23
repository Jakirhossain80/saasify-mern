// FILE: server/src/controllers/projects.controller.ts
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { createTenantProject, getTenantProjectById, listTenantProjects } from "../services/projects.service";
import { toObjectId } from "../repositories/projects.repo";

const ListQuerySchema = z.object({
  status: z.enum(["active", "archived"]).optional(),
  search: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const CreateProjectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
});

function requireTenantContext(req: Request): { tenantId: mongoose.Types.ObjectId; tenantSlug: string } {
  // resolveTenant guarantees these exist, but keep runtime guards for safety
  if (!req.tenantId || !req.tenantSlug) {
    throw new Error("TENANT_CONTEXT_MISSING");
  }
  return { tenantId: req.tenantId, tenantSlug: req.tenantSlug };
}

function requireActorUserId(req: Request): mongoose.Types.ObjectId {
  const userId = req.user?.userId;
  if (!userId || !mongoose.isValidObjectId(userId)) {
    throw new Error("UNAUTHORIZED");
  }
  return new mongoose.Types.ObjectId(userId);
}

export async function listProjectsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = requireTenantContext(req);

    const parsed = ListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid query",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const items = await listTenantProjects({
      tenantId,
      status: parsed.data.status,
      search: parsed.data.search,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return res.status(200).json({ items });
  } catch (err) {
    if (err instanceof Error && err.message === "TENANT_CONTEXT_MISSING") {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }
    return next(err);
  }
}

export async function getProjectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = requireTenantContext(req);

    const projectIdRaw = (req.params?.projectId ?? "").trim();
    const projectId = toObjectId(projectIdRaw);
    if (!projectId) {
      return res.status(400).json({ code: "INVALID_ID", message: "Invalid project id" });
    }

    const doc = await getTenantProjectById({ tenantId, projectId });
    if (!doc) {
      // ✅ Includes: "project exists but belongs to another tenant" → still 404
      return res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
    }

    return res.status(200).json({
      project: {
        id: String(doc._id),
        tenantId: String(doc.tenantId),
        title: doc.title,
        description: doc.description,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "TENANT_CONTEXT_MISSING") {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }
    return next(err);
  }
}

export async function createProjectHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { tenantId } = requireTenantContext(req);
    const actorUserId = requireActorUserId(req);

    const parsed = CreateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const doc = await createTenantProject({
      tenantId,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      actorUserId,
    });

    return res.status(201).json({
      project: {
        id: String(doc._id),
        tenantId: String(doc.tenantId),
        title: doc.title,
        description: doc.description,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "TENANT_CONTEXT_MISSING") {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }
    return next(err);
  }
}
