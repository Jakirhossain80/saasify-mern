// FILE: server/src/repositories/savedViews.repo.ts
import type { Types } from "mongoose";
import { connectDB } from "../db/connect";
import { SavedView, type SavedViewDoc } from "../models/SavedView";

export async function createSavedView(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  filters: { status?: "active" | "archived" | null; search?: string | null };
  isPinned?: boolean;
}): Promise<SavedViewDoc> {
  await connectDB();

  return SavedView.create({
    tenantId: input.tenantId,
    userId: input.userId,
    name: input.name.trim(),
    filters: {
      status: input.filters.status ?? null,
      search: input.filters.search ?? null,
    },
    // store boolean, but don't force `undefined` → `false` at call sites
    isPinned: input.isPinned ?? false,
  });
}

export async function listSavedViews(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
}): Promise<SavedViewDoc[]> {
  await connectDB();

  return SavedView.find({ tenantId: input.tenantId, userId: input.userId })
    .sort({ isPinned: -1, createdAt: -1 })
    .exec();
}

export async function togglePinSavedView(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  viewId: Types.ObjectId;
  isPinned: boolean;
}): Promise<SavedViewDoc | null> {
  await connectDB();

  return SavedView.findOneAndUpdate(
    { _id: input.viewId, tenantId: input.tenantId, userId: input.userId },
    { $set: { isPinned: input.isPinned } },
    { new: true }
  ).exec();
}

export async function deleteSavedView(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  viewId: Types.ObjectId;
}): Promise<SavedViewDoc | null> {
  await connectDB();

  return SavedView.findOneAndDelete({
    _id: input.viewId,
    tenantId: input.tenantId,
    userId: input.userId,
  }).exec();
}
