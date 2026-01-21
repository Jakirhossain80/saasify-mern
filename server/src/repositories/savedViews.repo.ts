// FILE: server/src/repositories/savedViews.repo.ts
import type mongoose from "mongoose";
import { connectDB } from "../db/connect";
import { SavedView, type SavedViewDoc } from "../models/SavedView";

export async function createSavedView(input: {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
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
    isPinned: Boolean(input.isPinned),
  });
}

export async function listSavedViews(input: {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}): Promise<SavedViewDoc[]> {
  await connectDB();
  return SavedView.find({ tenantId: input.tenantId, userId: input.userId })
    .sort({ isPinned: -1, createdAt: -1 })
    .exec();
}

export async function togglePinSavedView(input: {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  viewId: mongoose.Types.ObjectId;
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
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  viewId: mongoose.Types.ObjectId;
}): Promise<SavedViewDoc | null> {
  await connectDB();
  return SavedView.findOneAndDelete({
    _id: input.viewId,
    tenantId: input.tenantId,
    userId: input.userId,
  }).exec();
}
