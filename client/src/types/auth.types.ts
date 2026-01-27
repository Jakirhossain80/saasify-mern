// FILE: client/src/types/auth.types.ts
export type PlatformRole = "platformAdmin" | "user";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
  imageUrl?: string;
  platformRole: PlatformRole;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};
