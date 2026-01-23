// FILE: server/src/config/cors.ts
import type { CorsOptions } from "cors";
import { env } from "./env";

export function getCorsOptions(): CorsOptions {
return {
origin: env.CLIENT_ORIGIN,
credentials: true,
methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
allowedHeaders: ["Content-Type", "Authorization", "x-tenant-slug"],
};
}