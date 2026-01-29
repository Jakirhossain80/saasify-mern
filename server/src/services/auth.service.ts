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

import { createTenantRepo, findTenantBySlugRepo } from "../repositories/tenants.repo";
import { createMembershipRepo } from "../repositories/memberships.repo";

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

function baseTenantNameFromUser(input: { name?: string; email: string }): string {
  const n = (input.name ?? "").trim();
  if (n) return `${n}'s Workspace`;
  const local = input.email.split("@")[0] ?? "workspace";
  return `${local}'s Workspace`;
}

/**
 * Slug rules:
 * - lowercase
 * - letters/numbers/hyphen only
 * - collapse multiple hyphens
 * - trim hyphens
 */
function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function shortRandom(): string {
  // 6 chars is enough for demo uniqueness
  return Math.random().toString(36).slice(2, 8);
}

async function ensureUniqueTenantSlug(base: string): Promise<string> {
  // try base, then base-xxxxxx a few times
  const candidateBase = slugify(base) || `tenant-${shortRandom()}`;

  const existing = await findTenantBySlugRepo(candidateBase);
  if (!existing) return candidateBase;

  for (let i = 0; i < 6; i++) {
    const candidate = `${candidateBase}-${shortRandom()}`;
    // eslint-disable-next-line no-await-in-loop
    const hit = await findTenantBySlugRepo(candidate);
    if (!hit) return candidate;
  }

  // fallback (extremely unlikely)
  return `${candidateBase}-${Date.now().toString(36)}`;
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

export type RegisterResult = LoginResult & {
  tenant: { id: string; slug: string; name: string };
  membership: { id: string; role: "tenantAdmin"; status: "active" };
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

  // Avoid leaking whether the email exists
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
 * REGISTER (Option A MVP)
 * POST /auth/register
 * -> creates user
 * -> creates tenant
 * -> creates membership (tenantAdmin)
 * -> issues accessToken + refresh cookie token (raw)
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
  const session = await mongoose.startSession();

  try {
    let createdUserId: Types.ObjectId | null = null;
    let createdTenantId: Types.ObjectId | null = null;
    let createdMembershipId: Types.ObjectId | null = null;
    let tenantSlug = "";
    let tenantName = "";

    await session.withTransaction(async () => {
      const passwordHash = await bcrypt.hash(input.password, 10);

      const user = await createUser(
        {
          email,
          passwordHash,
          name: input.name ?? "",
          platformRole: "user",
          isActive: true,
        },
        session
      );

      const userId = user._id as unknown as Types.ObjectId;
      createdUserId = userId;

      // Create a default tenant for the new user
      tenantName = baseTenantNameFromUser({ name: user.name ?? "", email: user.email });
      const baseSlugSource = (user.name?.trim() ? user.name : user.email.split("@")[0]) || "tenant";
      tenantSlug = await ensureUniqueTenantSlug(baseSlugSource);

      const tenant = await createTenantRepo(
        {
          name: tenantName,
          slug: tenantSlug,
          logoUrl: "",
        },
        session
      );

      const tenantId = tenant._id as unknown as Types.ObjectId;
      createdTenantId = tenantId;

      // Create membership: user becomes tenantAdmin of their new tenant
      const membership = await createMembershipRepo(
        {
          tenantId,
          userId,
          role: "tenantAdmin",
          status: "active",
        },
        session
      );

      createdMembershipId = membership._id as unknown as Types.ObjectId;

      // Track last sign-in
      await setLastSignedInAt(userId, session);
    });

    if (!createdUserId || !createdTenantId || !createdMembershipId) {
      throw new Error("REGISTER_FAILED");
    }

    // After transaction: issue tokens + refresh session (not inside transaction is OK,
    // but we keep it consistent and safe)
    const accessToken = signAccessToken({ sub: String(createdUserId), email });

    const refreshExpiresAt = computeExpiresAt(env.REFRESH_TOKEN_EXPIRES_IN);
    const refreshSession = await createRefreshSession({
      userId: createdUserId,
      tokenHash: "TEMP",
      expiresAt: refreshExpiresAt,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
    });

    const refreshToken = signRefreshToken({ sub: String(createdUserId), jti: String(refreshSession._id) });
    const tokenHash = hashRefreshToken(refreshToken);

    const rotated = await rotateRefreshSession({
      sessionId: refreshSession._id,
      userId: createdUserId,
      newTokenHash: tokenHash,
      newExpiresAt: refreshExpiresAt,
    });

    if (!rotated) {
      await revokeAllUserSessions(createdUserId);
      throw new Error("REGISTER_FAILED");
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: String(createdUserId),
        email,
        name: input.name ?? "",
        imageUrl: "",
        platformRole: "user",
      },
      tenant: {
        id: String(createdTenantId),
        slug: tenantSlug,
        name: tenantName,
      },
      membership: {
        id: String(createdMembershipId),
        role: "tenantAdmin",
        status: "active",
      },
    };
  } finally {
    session.endSession();
  }
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
