// FILE: server/src/controllers/invites.controller.ts
import type { Request, Response, NextFunction } from "express";
import mongoose, { type Types } from "mongoose";
import {
  createInviteBodySchema,
  inviteIdParamsSchema,
  inviteParamsSchema,
} from "../validations/invite.schema";
import {
  createInviteService,
  listInvitesService,
  revokeInviteService,
} from "../services/invites.service";
import { acceptInviteService } from "../services/invites.service";

function getActorUserId(req: Request): Types.ObjectId | null {
  const raw =
    (req.user as any)?.userId ??
    (req.user as any)?.id ??
    (req.user as any)?._id ??
    null;

  if (!raw || !mongoose.isValidObjectId(String(raw))) return null;
  return new mongoose.Types.ObjectId(String(raw));
}

/**
 * POST /api/tenant/:tenantId/invites (tenantAdmin)
 * body: { email, role? }
 */
export async function createInviteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const paramsParsed = inviteParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: paramsParsed.error.flatten().fieldErrors,
      });
    }

    const bodyParsed = createInviteBodySchema.safeParse(req.body);
    if (!bodyParsed.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        fieldErrors: bodyParsed.error.flatten().fieldErrors,
      });
    }

    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const tenantId = new mongoose.Types.ObjectId(paramsParsed.data.tenantId);

    const result = await createInviteService({
      tenantId,
      email: bodyParsed.data.email,
      role: bodyParsed.data.role ?? "member",
      invitedByUserId: actorUserId,
    });

    return res.status(201).json(result);
  } catch (err: any) {
    if (err?.statusCode) {
      return res.status(err.statusCode).json({
        code: err.code ?? "ERROR",
        message: err.message ?? "Something went wrong",
      });
    }
    return next(err);
  }
}

/**
 * GET /api/tenant/:tenantId/invites (tenantAdmin)
 * query: page, limit, status?
 */
export async function listInvitesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const paramsParsed = inviteParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId",
        fieldErrors: paramsParsed.error.flatten().fieldErrors,
      });
    }

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));

    const statusRaw = String(req.query?.status ?? "").trim();
    const status =
      statusRaw === "pending" ||
      statusRaw === "accepted" ||
      statusRaw === "revoked" ||
      statusRaw === "expired"
        ? statusRaw
        : undefined;

    const tenantId = new mongoose.Types.ObjectId(paramsParsed.data.tenantId);

    const data = await listInvitesService({ tenantId, page, limit, status });

    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/tenant/:tenantId/invites/:inviteId (tenantAdmin)
 */
export async function revokeInviteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const paramsParsed = inviteIdParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid tenantId/inviteId",
        fieldErrors: paramsParsed.error.flatten().fieldErrors,
      });
    }

    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const tenantId = new mongoose.Types.ObjectId(paramsParsed.data.tenantId);
    const inviteId = new mongoose.Types.ObjectId(paramsParsed.data.inviteId);

    const result = await revokeInviteService({
      tenantId,
      inviteId,
      revokedByUserId: actorUserId,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    if (err?.statusCode) {
      return res.status(err.statusCode).json({
        code: err.code ?? "ERROR",
        message: err.message ?? "Something went wrong",
      });
    }
    return next(err);
  }
}


/**
 * POST /api/t/:tenantSlug/invites/accept
 * body: { token }
 *
 * NOTE:
 * This route must NOT use requireTenantMembership,
 * because the user is NOT a member yet.
 */
export async function acceptInviteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const actorUserId = getActorUserId(req);
    if (!actorUserId) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    const tenantId = req.tenantId as Types.ObjectId | undefined;
    if (!tenantId) {
      return res.status(404).json({ code: "TENANT_NOT_FOUND", message: "Tenant not found" });
    }

    const token = String(req.body?.token ?? "").trim();
    if (!token) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "token is required",
      });
    }

    const result = await acceptInviteService({
      tenantId,
      token,
      acceptedByUserId: actorUserId,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    if (err?.statusCode) {
      return res.status(err.statusCode).json({
        code: err.code ?? "ERROR",
        message: err.message ?? "Something went wrong",
      });
    }
    return next(err);
  }
}

