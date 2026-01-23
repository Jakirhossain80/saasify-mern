// FILE: server/src/repositories/users.repo.ts
import mongoose, { type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { User, type UserDoc } from "../models/User";

export type UpsertUserInput = {
  userId: string;
  email: string;
  name?: string;
  imageUrl?: string;
  platformRole?: "platformAdmin" | "user";
};

export async function upsertUserByUserId(input: UpsertUserInput): Promise<UserDoc> {
  await connectDB();

  // NOTE:
  // Your provided User model does NOT include `userId` or `lastSignedInAt` fields.
  // To keep Phase-2 compiling + minimal, we upsert by `email` (unique) and
  // update a compatible subset of fields.
  const update: {
    email: string;
    name: string;
    imageUrl: string;
    image: string;
    platformRole?: "platformAdmin" | "user";
    role?: "platformAdmin" | "user";
  } = {
    email: input.email.trim().toLowerCase(),
    name: input.name ?? "",
    imageUrl: input.imageUrl ?? "",
    image: input.imageUrl ?? "",
  };

  if (input.platformRole) {
    update.platformRole = input.platformRole;
    update.role = input.platformRole; // keep legacy alias in sync
  }

  const doc = await User.findOneAndUpdate(
    { email: update.email },
    { $set: update, $setOnInsert: { email: update.email } },
    { new: true, upsert: true }
  ).exec();

  return doc;
}

export async function findUserByUserId(userId: string): Promise<UserDoc | null> {
  await connectDB();

  // NOTE:
  // Your current model doesn't have `userId`, so we interpret this as Mongo _id.
  // This keeps compatibility without adding new fields in Phase-2.
  if (!mongoose.isValidObjectId(userId)) return null;
  return User.findById(userId).exec();
}

export async function findUserById(userId: Types.ObjectId): Promise<UserDoc | null> {
  await connectDB();
  return User.findById(userId).exec();
}
