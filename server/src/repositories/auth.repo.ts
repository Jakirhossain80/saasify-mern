// FILE: server/src/repositories/auth.repo.ts
import mongoose, { type ClientSession, type Types } from "mongoose";
import { connectDB } from "../db/connect";
import { User, type UserDoc } from "../models/User";
import { RefreshSession, type RefreshSessionDoc } from "../models/RefreshSession";

export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  await connectDB();
  return User.findOne({ email: email.trim().toLowerCase() }).exec();
}

export async function findUserById(userId: Types.ObjectId): Promise<UserDoc | null> {
  await connectDB();
  return User.findById(userId).exec();
}

export async function createUser(
  input: {
    email: string;
    passwordHash: string;
    name?: string;
    platformRole?: "user" | "platformAdmin";
    isActive?: boolean;
  },
  session?: ClientSession
): Promise<UserDoc> {
  await connectDB();

  const doc = new User({
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
    name: input.name ?? "",
    platformRole: input.platformRole ?? "user",
    isActive: input.isActive ?? true,
    lastSignedInAt: new Date(),
  });

  await doc.save({ session });
  return doc;
}

export async function setLastSignedInAt(userId: Types.ObjectId, session?: ClientSession): Promise<void> {
  await connectDB();
  await User.updateOne({ _id: userId }, { $set: { lastSignedInAt: new Date() } }, { session }).exec();
}

export async function createRefreshSession(input: {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<RefreshSessionDoc> {
  await connectDB();
  return RefreshSession.create({
    userId: input.userId,
    tokenHash: input.tokenHash,
    expiresAt: input.expiresAt,
    rotatedAt: null,
    revokedAt: null,
    userAgent: input.userAgent ?? null,
    ip: input.ip ?? null,
  });
}

export async function findValidRefreshSession(input: {
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
}): Promise<RefreshSessionDoc | null> {
  await connectDB();

  return RefreshSession.findOne({
    _id: input.sessionId,
    userId: input.userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).exec();
}

export async function rotateRefreshSession(input: {
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  newTokenHash: string;
  newExpiresAt: Date;
}): Promise<RefreshSessionDoc | null> {
  await connectDB();

  return RefreshSession.findOneAndUpdate(
    { _id: input.sessionId, userId: input.userId, revokedAt: null },
    { $set: { tokenHash: input.newTokenHash, expiresAt: input.newExpiresAt, rotatedAt: new Date() } },
    { new: true }
  ).exec();
}

export async function revokeRefreshSession(input: {
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
}): Promise<void> {
  await connectDB();
  await RefreshSession.updateOne(
    { _id: input.sessionId, userId: input.userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  ).exec();
}

export async function revokeAllUserSessions(userId: Types.ObjectId): Promise<void> {
  await connectDB();
  await RefreshSession.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } }).exec();
}

export function toObjectId(id: string): Types.ObjectId | null {
  if (!mongoose.isValidObjectId(id)) return null;
  return new mongoose.Types.ObjectId(id);
}
