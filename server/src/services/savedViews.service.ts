// FILE: server/src/services/savedViews.service.ts
import type { Types } from "mongoose";
import { createAuditLog } from "../repositories/auditLogs.repo";
import {
  createSavedView,
  deleteSavedView,
  listSavedViews,
  togglePinSavedView,
} from "../repositories/savedViews.repo";
import type { SavedViewDoc } from "../models/SavedView";

export async function createProjectSavedView(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  filters: { status?: "active" | "archived" | null; search?: string | null };
  isPinned?: boolean;
}): Promise<SavedViewDoc> {
  // exactOptionalPropertyTypes-safe: don't pass `isPinned: undefined`
  const payload: Parameters<typeof createSavedView>[0] = {
    tenantId: input.tenantId,
    userId: input.userId,
    name: input.name,
    filters: input.filters,
    ...(typeof input.isPinned === "boolean" ? { isPinned: input.isPinned } : {}),
  };

  const doc = await createSavedView(payload);

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
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
}): Promise<SavedViewDoc[]> {
  return listSavedViews({ tenantId: input.tenantId, userId: input.userId });
}

export async function setSavedViewPinned(input: {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  viewId: Types.ObjectId;
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
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  viewId: Types.ObjectId;
}): Promise<SavedViewDoc | null> {
  return deleteSavedView({
    tenantId: input.tenantId,
    userId: input.userId,
    viewId: input.viewId,
  });
}
