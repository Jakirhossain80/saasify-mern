// FILE: server/src/middlewares/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens";

/**

Verifies access token from:

Authorization: Bearer <token>

On success -> req.user = { userId, email }
*/
export function requireAuth(req: Request, res: Response, next: NextFunction) {
try {
const header = req.header("authorization") ?? "";
const [scheme, token] = header.split(" ");

if (scheme !== "Bearer" || !token) {
return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing access token" });
}

const claims = verifyAccessToken(token);
req.user = { userId: claims.sub, email: claims.email };

return next();
} catch {
return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid or expired access token" });
}
}