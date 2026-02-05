// FILE: server/src/controllers/auditLogs.controller.ts
import type { Request, Response, NextFunction } from "express";
import { listAuditLogsQuerySchema } from "../validations/auditLogs.schema";
import { listPlatformAuditLogsService } from "../services/auditLogs.service";

export async function listPlatformAuditLogsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const q = listAuditLogsQuerySchema.parse(req.query);

    const data = await listPlatformAuditLogsService({
      page: q.page,
      limit: q.limit,
      action: q.action,
      tenantId: q.tenantId,
      actorUserId: q.actorUserId,
      dateFrom: q.dateFrom,
      dateTo: q.dateTo,
    });

    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
}
