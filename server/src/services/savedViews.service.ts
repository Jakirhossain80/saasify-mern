// FILE: server/src/services/savedViews.service.ts
import type mongoose from "mongoose";
import { createAuditLog } from "../repositories/auditLogs.repo";
import {
  createSavedView,
  deleteSavedView,
  listSavedViews,
  togglePinSavedView,
} from "../repositories/savedViews.repo";
import type { SavedViewDoc } from "../models/SavedView";

export async function createProjectSavedView(input: {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  filters: { status?: "active" | "archived" | null; search?: string | null };
  isPinned?: boolean;
}): Promise<SavedViewDoc> {
  const doc = await createSavedView({
    tenantId: input.tenantId,
    userId: input.userId,
    name: input.name,
    filters: input.filters,
    isPinned: input.isPinned,
  });

  await createAuditLog({
    scope: "tenant",
    tenantId: input.tenantId,
    actorUserId: input.userId,
    action: "project.updated",
    entity: { type: "SavedView", id: String(doc._id) },
    meta: { name: doc.name, isPinned: doc.isPinned },
  });

  return doc;
}

export async function listProjectSavedViews(input: {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}): Promise<SavedViewDoc[]> {
  return listSavedViews({ tenantId: input.tenantId, userId: input.userId });
}

export async function setSavedViewPinned(input: {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  viewId: mongoose.Types.ObjectId;
  isPinned: boolean;
}): Promise<SavedViewDoc | null> {
  return togglePinSavedView({
    tenantId: input.tenantId,
    userId: input.userId,
    viewId: input.viewId,
    isPinned: input.isPinned,
  });
}

export async function removeSavedView(input: {
  tenantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  viewId: mongoose.Types.ObjectId;
}): Promise<SavedViewDoc | null> {
  return deleteSavedView({
    tenantId: input.tenantId,
    userId: input.userId,
    viewId: input.viewId,
  });
}
