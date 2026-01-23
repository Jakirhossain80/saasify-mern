// FILE: server/src/services/users.service.ts
import type { Types } from "mongoose";
import { upsertUserByUserId, findUserById, findUserByUserId } from "../repositories/users.repo";
import type { UserDoc } from "../models/User";

type EnsureUserInput = {
  userId: string;
  email: string;
  name: string;
  imageUrl: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function ensureUser(input: EnsureUserInput): Promise<UserDoc> {
  const email = normalizeEmail(input.email);

  // NOTE:
  // In Phase-2 we keep this as a simple upsert to ensure a user exists.
  // Repo currently upserts by email; userId is accepted for future-proofing.
  return upsertUserByUserId({
    userId: input.userId,
    email,
    name: input.name ?? "",
    imageUrl: input.imageUrl ?? "",
  });
}

export async function getUserByUserId(userId: string): Promise<UserDoc | null> {
  // In Phase-2, repo interprets this as Mongo _id (ObjectId string). Keeps server compiling.
  return findUserByUserId(userId);
}

export async function getUserById(userId: Types.ObjectId): Promise<UserDoc | null> {
  return findUserById(userId);
}
