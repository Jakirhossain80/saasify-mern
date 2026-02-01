// FILE: server/src/services/auth.service.ts
import bcrypt from "bcryptjs";
import mongoose, { type Types } from "mongoose";

import { connectDB } from "../db/connect";

import {
  createRefreshSession,
  createUser,
  findUserByEmail,
  findUserById,
  findValidRefreshSession,
  rotateRefreshSession,
  revokeAllUserSessions,
  revokeRefreshSession,
  setLastSignedInAt,
  toObjectId,
} from "../repositories/auth.repo";

import { hashRefreshToken, timingSafeEqualHex } from "../utils/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";
import { env } from "../config/env";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Parse "15m", "7d" etc into an absolute expiresAt date.
 * Supports s/m/h/d.
 */
function computeExpiresAt(expiresIn: string): Date {
  const m = expiresIn.trim().match(/^(\d+)([smhd])$/);
  if (!m) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const amount = Number(m[1]);
  const unit = m[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return new Date(Date.now() + amount * (multipliers[unit] ?? 86_400_000));
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  imageUrl: string;
  platformRole: "user" | "platformAdmin";
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string; // raw (to set cookie)
  user: AuthUser;
};

export type RegisterResult = {
  user: AuthUser;
};

/**
 * =========================
 * LOGIN
 * =========================
 */
export async function loginWithEmailPassword(input: {
  email: string;
  password: string;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<LoginResult> {
  const email = normalizeEmail(input.email);
  const user = await findUserByEmail(email);

  if (!user || !user.passwordHash) throw new Error("INVALID_CREDENTIALS");

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  const userId = user._id as unknown as Types.ObjectId;
  await setLastSignedInAt(userId);

  const accessToken = signAccessToken({ sub: String(userId), email: user.email });

  const refreshExpiresAt = computeExpiresAt(env.REFRESH_TOKEN_EXPIRES_IN);
  const session = await createRefreshSession({
    userId,
    tokenHash: "TEMP",
    expiresAt: refreshExpiresAt,
    userAgent: input.userAgent ?? null,
    ip: input.ip ?? null,
  });

  const refreshToken = signRefreshToken({ sub: String(userId), jti: String(session._id) });
  const tokenHash = hashRefreshToken(refreshToken);

  const updated = await rotateRefreshSession({
    sessionId: session._id,
    userId,
    newTokenHash: tokenHash,
    newExpiresAt: refreshExpiresAt,
  });

  if (!updated) {
    await revokeAllUserSessions(userId);
    throw new Error("LOGIN_FAILED");
  }

  return {
    accessToken,
    refreshToken,
    user: {
      id: String(userId),
      email: user.email,
      name: user.name ?? "",
      imageUrl: (user.imageUrl || user.image || "").toString(),
      platformRole: (user.platformRole ?? "user") as "user" | "platformAdmin",
    },
  };
}

/**
 * =========================
 * REGISTER (Option A - Recommended)
 * POST /auth/register
 * -> creates user ONLY
 * -> no tenant creation
 * -> no membership creation
 * -> no tokens issued
 * =========================
 */
export async function registerWithEmailPassword(input: {
  name?: string;
  email: string;
  password: string;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<RegisterResult> {
  const email = normalizeEmail(input.email);

  const existing = await findUserByEmail(email);
  if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

  await connectDB();

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await createUser({
    email,
    passwordHash,
    name: input.name ?? "",
    platformRole: "user",
    isActive: true,
  });

  const userId = user._id as unknown as Types.ObjectId;

  return {
    user: {
      id: String(userId),
      email: user.email,
      name: user.name ?? "",
      imageUrl: (user.imageUrl || user.image || "").toString(),
      platformRole: (user.platformRole ?? "user") as "user" | "platformAdmin",
    },
  };
}

/**
 * =========================
 * REFRESH
 * =========================
 */
export async function refreshTokens(input: {
  refreshToken: string; // raw from cookie
  userAgent?: string | null;
  ip?: string | null;
}): Promise<{ accessToken: string; refreshToken: string }> {
  const claims = verifyRefreshToken(input.refreshToken);

  const userIdObj = toObjectId(claims.sub);
  const sessionIdObj = toObjectId(claims.jti);
  if (!userIdObj || !sessionIdObj) throw new Error("INVALID_REFRESH_TOKEN");

  const session = await findValidRefreshSession({ sessionId: sessionIdObj, userId: userIdObj });
  if (!session) {
    await revokeAllUserSessions(userIdObj);
    throw new Error("REFRESH_REJECTED");
  }

  const presentedHash = hashRefreshToken(input.refreshToken);
  const storedHash = (session.tokenHash ?? "").toString();

  const match = timingSafeEqualHex(presentedHash, storedHash);
  if (!match) {
    await revokeAllUserSessions(userIdObj);
    throw new Error("REFRESH_REJECTED");
  }

  const user = await findUserById(userIdObj);
  if (!user) {
    await revokeAllUserSessions(userIdObj);
    throw new Error("REFRESH_REJECTED");
  }

  const accessToken = signAccessToken({ sub: String(userIdObj), email: user.email });

  const newRefreshExpiresAt = computeExpiresAt(env.REFRESH_TOKEN_EXPIRES_IN);
  const newRefreshToken = signRefreshToken({ sub: String(userIdObj), jti: String(sessionIdObj) });
  const newHash = hashRefreshToken(newRefreshToken);

  const rotated = await rotateRefreshSession({
    sessionId: sessionIdObj,
    userId: userIdObj,
    newTokenHash: newHash,
    newExpiresAt: newRefreshExpiresAt,
  });

  if (!rotated) {
    await revokeAllUserSessions(userIdObj);
    throw new Error("REFRESH_REJECTED");
  }

  return { accessToken, refreshToken: newRefreshToken };
}

/**
 * =========================
 * LOGOUT
 * =========================
 */
export async function logout(input: { refreshToken?: string | null }): Promise<void> {
  if (!input.refreshToken) return;

  try {
    const claims = verifyRefreshToken(input.refreshToken);
    const userIdObj = toObjectId(claims.sub);
    const sessionIdObj = toObjectId(claims.jti);
    if (!userIdObj || !sessionIdObj) return;

    await revokeRefreshSession({ sessionId: sessionIdObj, userId: userIdObj });
  } catch {
    // ignore
  }
}

/**
 * =========================
 * /me
 * =========================
 */
export async function getMe(userId: Types.ObjectId) {
  const user = await findUserById(userId);
  if (!user) return null;

  return {
    id: String(user._id),
    email: user.email,
    name: user.name ?? "",
    imageUrl: (user.imageUrl || user.image || "").toString(),
    platformRole: (user.platformRole ?? "user") as "user" | "platformAdmin",
  };
}
