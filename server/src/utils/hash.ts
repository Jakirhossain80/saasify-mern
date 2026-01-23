// FILE: server/src/utils/hash.ts
import crypto from "crypto";
import { env } from "../config/env";

/**

Hash refresh tokens before storing them in DB.

We use HMAC-SHA256 with a server-side secret (pepper) to protect the hash.

IMPORTANT: Never store raw refresh tokens.
*/
export function hashRefreshToken(rawToken: string): string {
return crypto.createHmac("sha256", env.JWT_REFRESH_SECRET).update(rawToken).digest("hex");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
const aBuf = Buffer.from(a, "hex");
const bBuf = Buffer.from(b, "hex");
if (aBuf.length !== bBuf.length) return false;
return crypto.timingSafeEqual(aBuf, bBuf);
}