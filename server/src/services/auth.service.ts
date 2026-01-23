// FILE: server/src/services/auth.service.ts
import bcrypt from "bcryptjs";
import mongoose, { type Types } from "mongoose";

import {
createRefreshSession,
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

Parse "15m", "7d" etc into an absolute expiresAt date.

We keep this small and safe (supports s/m/h/d).
*/
function computeExpiresAt(expiresIn: string): Date {
const m = expiresIn.trim().match(/^(\d+)([smhd])$/);
if (!m) {
// Fallback: 7 days if env is malformed
return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
const amount = Number(m[1]);
const unit = m[2];

const multipliers: Record<string, number> = {
s: 1000,
m: 60_000,
h: 3_600_000,
d: 86_400_000,
};

const ms = amount * (multipliers[unit] ?? 86_400_000);
return new Date(Date.now() + ms);
}

export type LoginResult = {
accessToken: string;
refreshToken: string; // raw (to set cookie)
user: { id: string; email: string; name: string; imageUrl: string; platformRole: "user" | "platformAdmin" };
};

export async function loginWithEmailPassword(input: {
email: string;
password: string;
userAgent?: string | null;
ip?: string | null;
}): Promise<LoginResult> {
const email = normalizeEmail(input.email);
const user = await findUserByEmail(email);

// Avoid leaking whether the email exists
if (!user || !user.passwordHash) {
throw new Error("INVALID_CREDENTIALS");
}

const ok = await bcrypt.compare(input.password, user.passwordHash);
if (!ok) throw new Error("INVALID_CREDENTIALS");

const userId = user._id as unknown as Types.ObjectId;
await setLastSignedInAt(userId);

const accessToken = signAccessToken({ sub: String(userId), email: user.email });

// Create refresh session
const refreshExpiresAt = computeExpiresAt(env.REFRESH_TOKEN_EXPIRES_IN);
const session = await createRefreshSession({
userId,
tokenHash: "TEMP", // set after token generated
expiresAt: refreshExpiresAt,
userAgent: input.userAgent ?? null,
ip: input.ip ?? null,
});

// Sign refresh token with jti=sessionId
const refreshToken = signRefreshToken({ sub: String(userId), jti: String(session._id) });
const tokenHash = hashRefreshToken(refreshToken);

// Store hash (overwrite TEMP)
const updated = await rotateRefreshSession({
sessionId: session._id,
userId,
newTokenHash: tokenHash,
newExpiresAt: refreshExpiresAt,
});

if (!updated) {
// If something weird happens, invalidate all sessions for safety
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

export type RefreshResult = {
accessToken: string;
refreshToken: string;
};

export async function refreshTokens(input: {
refreshToken: string; // raw from cookie
userAgent?: string | null;
ip?: string | null;
}): Promise<RefreshResult> {
const claims = verifyRefreshToken(input.refreshToken);

const userIdObj = toObjectId(claims.sub);
const sessionIdObj = toObjectId(claims.jti);
if (!userIdObj || !sessionIdObj) throw new Error("INVALID_REFRESH_TOKEN");

const session = await findValidRefreshSession({ sessionId: sessionIdObj, userId: userIdObj });
if (!session) {
// Possible token reuse / stolen cookie -> invalidate everything for safety
await revokeAllUserSessions(userIdObj);
throw new Error("REFRESH_REJECTED");
}

// Compare stored hash with hash of presented token
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

// Rotate refresh token (same sessionId, new token + new hash)
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

export async function logout(input: { refreshToken?: string | null }): Promise<void> {
if (!input.refreshToken) return;

// If token is invalid/expired, still consider logout successful (but attempt revoke)
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

/me: requires valid access token (handled in requireAuth middleware)

This helper fetches user data.
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