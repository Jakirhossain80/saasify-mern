// FILE: server/src/middlewares/errorHandler.ts
import type { Request, Response, NextFunction } from "express";

/**

Minimal production-friendly error handler.

In real prod, prefer structured logging (pino) and request ids.
*/
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
const message = err instanceof Error ? err.message : "Unknown error";
// Avoid leaking internals
return res.status(500).json({ code: "INTERNAL_ERROR", message });
}