// FILE: server/src/config/cookies.ts
import type { CookieOptions } from "express";
import { isProduction } from "./env";

/**

Local dev (http://localhost
):

secure: false (because http)

sameSite: "lax" works for same-site requests (localhost:5173 -> localhost:5000)

Production (https):

secure: true

sameSite: "none" (typical when frontend + backend are different origins)
*/
export function getRefreshCookieOptions(): CookieOptions {
const prod = isProduction();

return {
httpOnly: true,
secure: prod,
sameSite: prod ? "none" : "lax",
// cookie is only needed for refresh/logout flows
path: "/api/auth",
};
}