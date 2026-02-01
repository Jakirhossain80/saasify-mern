// FILE: server/src/middlewares/requireAuth.ts
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { verifyAccessToken } from "../utils/tokens";
import { User } from "../models/User";

/**
 * Verifies access token from:
 * Authorization: Bearer <token>
 *
 * On success -> req.user = { userId, email, platformRole }
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization") ?? "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing access token" });
    }

    const claims = verifyAccessToken(token);

    const userId = claims.sub;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token subject" });
    }

    // ✅ Fetch role from DB so platform checks are accurate
    const user = await User.findById(userId).select("platformRole role isActive email").lean();
    if (!user) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "User not found" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ code: "ACCOUNT_DISABLED", message: "Account disabled" });
    }

    // ✅ Canonical camelCase + legacy support
    const platformRole =
      (user.platformRole ?? "").toString().trim() ||
      (user.role ?? "").toString().trim();

    req.user = {
      userId,
      email: user.email,
      platformRole: platformRole as "user" | "platformAdmin",
    };

    return next();
  } catch {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid or expired access token" });
  }
}
