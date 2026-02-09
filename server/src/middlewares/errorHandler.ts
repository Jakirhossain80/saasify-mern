// FILE: server/src/middlewares/errorHandler.ts
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";

/**
 * Minimal production-friendly error handler (upgraded safely).
 * - Preserves your existing "don't leak internals" behavior
 * - Adds support for:
 *   ✅ err.status / err.statusCode (so business-rule errors return 400/403/etc)
 *   ✅ Zod validation errors → 400 + fieldErrors
 *   ✅ Mongoose CastError (invalid ObjectId) → 400
 *
 * In real prod, prefer structured logging (pino) and request ids.
 */

type AnyErr = Error & {
  status?: number;
  statusCode?: number;
  code?: string;
  fieldErrors?: unknown;
};

function pickStatus(err: AnyErr) {
  return err.status ?? err.statusCode ?? 500;
}

function statusToCode(status: number) {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "VALIDATION_ERROR";
    default:
      return "INTERNAL_ERROR";
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // ✅ Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      fieldErrors: err.flatten().fieldErrors,
    });
  }

  // ✅ Mongoose invalid ObjectId / cast errors
  // Example: Cast to ObjectId failed for value "abc"
  if (err instanceof mongoose.Error.CastError || (err as any)?.name === "CastError") {
    return res.status(400).json({
      code: "INVALID_OBJECT_ID",
      message: "Invalid ObjectId",
    });
  }

  const e = err as AnyErr;

  const status = pickStatus(e);
  const code = e.code ?? statusToCode(status);

  // ✅ Avoid leaking internals (keep your original behavior)
  const message = status === 500 ? "Internal server error" : e.message || "Request failed";

  return res.status(status).json({
    code,
    message,
    ...(e.fieldErrors ? { fieldErrors: e.fieldErrors } : {}),
  });
}
