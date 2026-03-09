// FILE: server/src/config/env.ts
import { z } from "zod";

/**
 * Centralized env loading + validation.
 * Keep secrets ONLY in .env or hosting platform env variables.
 * Never commit real production secrets.
 */
const EnvSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),

  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1).default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1).default("7d"),

  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  PORT: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 5000))
    .pipe(z.number().int().positive()),

  COOKIE_NAME_REFRESH: z.string().min(1).default("saasify_refresh"),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",

  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  NODE_ENV: (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test",

  PORT: process.env.PORT,

  COOKIE_NAME_REFRESH: process.env.COOKIE_NAME_REFRESH ?? "saasify_refresh",
});

export function isProduction(): boolean {
  return env.NODE_ENV === "production";
}

