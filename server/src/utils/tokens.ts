// FILE: server/src/utils/tokens.ts
import jwt, { type JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

export type AccessTokenClaims = {
sub: string; // userId (ObjectId string)
email: string;
};

export type RefreshTokenClaims = {
sub: string; // userId (ObjectId string)
jti: string; // refresh session id
};

export function signAccessToken(payload: AccessTokenClaims): string {
return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
expiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
});
}

export function signRefreshToken(payload: RefreshTokenClaims): string {
return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
});
}

export function verifyAccessToken(token: string): AccessTokenClaims {
const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
if (typeof decoded?.sub !== "string" || typeof decoded?.email !== "string") {
throw new Error("INVALID_ACCESS_TOKEN");
}
return { sub: decoded.sub, email: decoded.email };
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
if (typeof decoded?.sub !== "string" || typeof decoded?.jti !== "string") {
throw new Error("INVALID_REFRESH_TOKEN");
}
return { sub: decoded.sub, jti: decoded.jti };
}

/** Generate a strong random token for refresh cookie */
export function generateOpaqueToken(): string {
return crypto.randomBytes(48).toString("hex");
}