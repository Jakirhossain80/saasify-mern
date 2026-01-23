// FILE: server/src/controllers/auth.controller.ts
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getRefreshCookieOptions } from "../config/cookies";
import { loginWithEmailPassword, refreshTokens, logout, getMe } from "../services/auth.service";
import mongoose, { type Types } from "mongoose";

const LoginSchema = z.object({
email: z.string().trim().email(),
password: z.string().min(6),
});

function getClientIp(req: Request): string | null {
// in local dev behind no proxy, req.ip is fine
return req.ip ?? null;
}

export async function postLogin(req: Request, res: Response, next: NextFunction) {
try {
const parsed = LoginSchema.safeParse(req.body);
if (!parsed.success) {
return res.status(400).json({
code: "VALIDATION_ERROR",
message: "Invalid input",
fieldErrors: parsed.error.flatten().fieldErrors,
});
}

const result = await loginWithEmailPassword({
  email: parsed.data.email,
  password: parsed.data.password,
  userAgent: req.get("user-agent") ?? null,
  ip: getClientIp(req),
});

res.cookie("refreshToken", result.refreshToken, {
  ...getRefreshCookieOptions(),
  // set expiry roughly to match refresh expiry policy; cookie expires is optional,
  // but having it is nicer for browser behavior.
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

return res.status(200).json({
  accessToken: result.accessToken,
  user: result.user,
});


} catch (err) {
// Don’t leak which part failed
if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });
}
return next(err);
}
}

export async function postRefresh(req: Request, res: Response, next: NextFunction) {
try {
const token = req.cookies?.refreshToken as string | undefined;
if (!token) {
return res.status(401).json({ code: "NO_REFRESH_TOKEN", message: "Missing refresh token" });
}

const rotated = await refreshTokens({
  refreshToken: token,
  userAgent: req.get("user-agent") ?? null,
  ip: getClientIp(req),
});

res.cookie("refreshToken", rotated.refreshToken, {
  ...getRefreshCookieOptions(),
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

return res.status(200).json({ accessToken: rotated.accessToken });


} catch (err) {
// Any refresh failure: clear cookie
res.clearCookie("refreshToken", getRefreshCookieOptions());

if (err instanceof Error && (err.message === "REFRESH_REJECTED" || err.message === "INVALID_REFRESH_TOKEN")) {
  return res.status(401).json({ code: "REFRESH_REJECTED", message: "Refresh rejected" });
}
return next(err);


}
}

export async function postLogout(req: Request, res: Response, next: NextFunction) {
try {
const token = req.cookies?.refreshToken as string | undefined;

await logout({ refreshToken: token ?? null });

// Always clear cookie (even if token missing/invalid)
res.clearCookie("refreshToken", getRefreshCookieOptions());

return res.status(200).json({ ok: true });


} catch (err) {
// Still clear cookie on errors
res.clearCookie("refreshToken", getRefreshCookieOptions());
return next(err);
}
}

export async function getMeHandler(req: Request, res: Response) {
// requireAuth sets req.user
const userId = req.user?.userId;
if (!userId || !mongoose.isValidObjectId(userId)) {
return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
}

const me = await getMe(new mongoose.Types.ObjectId(userId));
if (!me) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

return res.status(200).json({ user: me });
}