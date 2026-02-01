// FILE: server/src/controllers/auth.controller.ts
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import { getRefreshCookieOptions } from "../config/cookies";
import {
  loginWithEmailPassword,
  refreshTokens,
  logout,
  getMe,
  registerWithEmailPassword,
} from "../services/auth.service";

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(80).optional().default(""),
  email: z.string().trim().email(),
  password: z.string().min(6).max(72),
});

function getClientIp(req: Request): string | null {
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      return res
        .status(401)
        .json({ code: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    }
    return next(err);
  }
}

/**
 * ✅ REGISTER (Option A)
 * - Creates ONLY the user
 * - Does NOT create tenant
 * - Does NOT create membership
 * - Does NOT set refresh cookie
 * - Client should redirect to Sign In after success
 */
export async function postRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const created = await registerWithEmailPassword({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      userAgent: req.get("user-agent") ?? null,
      ip: getClientIp(req),
    });

    // ✅ No cookies here. No auto-login.
    return res.status(201).json({
      ok: true,
      message: "Account created. Please sign in.",
      user: created.user,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_ALREADY_EXISTS") {
      return res
        .status(409)
        .json({ code: "EMAIL_ALREADY_EXISTS", message: "Email already in use" });
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

    res.clearCookie("refreshToken", getRefreshCookieOptions());

    return res.status(200).json({ ok: true });
  } catch (err) {
    res.clearCookie("refreshToken", getRefreshCookieOptions());
    return next(err);
  }
}

export async function getMeHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId || !mongoose.isValidObjectId(userId)) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const me = await getMe(new mongoose.Types.ObjectId(userId));
  if (!me) return res.status(404).json({ code: "NOT_FOUND", message: "User not found" });

  return res.status(200).json({ user: me });
}
