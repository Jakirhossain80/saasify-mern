// FILE: client/src/pages/tenant/ProjectsList.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import PageShell from "../../components/common/PageShell";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";
import { useAuthStore } from "../../store/auth.store";

type ProjectItem = {
  id: string;
  title: string;
  description?: string;
  status?: "active" | "archived" | string;
  createdAt?: string;
};

type ProjectsResponse =
  | { items: ProjectItem[] }
  | { projects: ProjectItem[] }
  | ProjectItem[];

function extractProjects(data: ProjectsResponse | undefined): ProjectItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if ("items" in data && Array.isArray(data.items)) return data.items;
  if ("projects" in data && Array.isArray(data.projects)) return data.projects;
  return [];
}

function projectByIdUrl(tenantSlug: string, projectId: string) {
  return `${API.tenant.projects(tenantSlug)}/${projectId}`;
}

export default function ProjectsList() {
  const { tenantSlug = "" } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  // ✅ read query string (?new=1)
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ tenant role (from Membership) should be stored here
  const activeTenantRole = useAuthStore((s) => s.activeTenantRole);
  const isTenantAdminUi = activeTenantRole === "tenantAdmin";

  // ---------------------------
  // UI state (Create modal)
  // ---------------------------
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // ---------------------------
  // UI state (Edit modal)
  // ---------------------------
  const [editOpen, setEditOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // ---------------------------
  // ✅ UI state (Confirm Delete modal)
  // ---------------------------
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleteProjectTitle, setDeleteProjectTitle] = useState("");

  function openDeleteModal(p: ProjectItem) {
    setDeleteProjectId(p.id);
    setDeleteProjectTitle(p.title ?? "");
    setConfirmDeleteOpen(true);
  }

  function closeDeleteModal() {
    setConfirmDeleteOpen(false);
    setDeleteProjectId(null);
    setDeleteProjectTitle("");
  }

  // ✅ FIX: open modal when coming from dashboard link: /projects?new=1
  useEffect(() => {
    if (!tenantSlug) return;

    const shouldOpen = searchParams.get("new") === "1";
    if (shouldOpen && isTenantAdminUi) {
      setCreateOpen(true);

      // ✅ clean URL so refresh doesn't keep opening modal
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, searchParams, setSearchParams, isTenantAdminUi]);

  const projectsQ = useQuery({
    queryKey: ["tenantProjects", tenantSlug],
    queryFn: async () => {
      const { data } = await http.get<ProjectsResponse>(API.tenant.projects(tenantSlug));
      return data;
    },
    enabled: !!tenantSlug,
  });

  const projects = useMemo(() => extractProjects(projectsQ.data), [projectsQ.data]);

  // ---------------------------
  // Create Project
  // ---------------------------
  const createM = useMutation({
    mutationFn: async () => {
      const payload: any = { title: title.trim() };
      if (description.trim()) payload.description = description.trim();

      const { data } = await http.post(API.tenant.projects(tenantSlug), payload);
      return data;
    },
    onSuccess: async () => {
      toast.success("Project created successfully.");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      await qc.invalidateQueries({ queryKey: ["tenantProjects", tenantSlug] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to create project.";
      toast.error(msg);
    },
  });

  const canSubmitCreate = title.trim().length > 1 && !createM.isPending;

  // ---------------------------
  // Edit Project (PATCH title/description)
  // ---------------------------
  const updateM = useMutation({
    mutationFn: async (input: { projectId: string; title: string; description: string }) => {
      const payload: any = {
        title: input.title.trim(),
        description: input.description.trim(),
      };

      const { data } = await http.patch(projectByIdUrl(tenantSlug, input.projectId), payload);
      return data;
    },
    onSuccess: async () => {
      toast.success("Project updated.");
      setEditOpen(false);
      setEditProjectId(null);
      setEditTitle("");
      setEditDescription("");
      await qc.invalidateQueries({ queryKey: ["tenantProjects", tenantSlug] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Failed to update project.";
      toast.error(msg);
    },
  });

  function openEditModal(p: ProjectItem) {
    setEditProjectId(p.id);
    setEditTitle(p.title ?? "");
    setEditDescription(p.description ?? "");
    setEditOpen(true);
  }

  const canSubmitEdit = !!editProjectId && editTitle.trim().length > 1 && !updateM.isPending;

  // ---------------------------
  // Archive / Unarchive / Delete
  // ---------------------------
  const archiveM = useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await http.patch(projectByIdUrl(tenantSlug, projectId), {
        status: "archived",
      });
      return data;
    },
    onSuccess: async () => {
      toast.success("Project archived.");
      await qc.invalidateQueries({ queryKey: ["tenantProjects", tenantSlug] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to archive project (check backend route).";
      toast.error(msg);
    },
  });

  const unarchiveM = useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await http.patch(projectByIdUrl(tenantSlug, projectId), {
        status: "active",
      });
      return data;
    },
    onSuccess: async () => {
      toast.success("Project unarchived.");
      await qc.invalidateQueries({ queryKey: ["tenantProjects", tenantSlug] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to unarchive project (check backend route).";
      toast.error(msg);
    },
  });

  const deleteM = useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await http.delete(projectByIdUrl(tenantSlug, projectId));
      return data;
    },
    onSuccess: async () => {
      toast.success("Project deleted.");
      closeDeleteModal();
      await qc.invalidateQueries({ queryKey: ["tenantProjects", tenantSlug] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete project (check backend route).";
      toast.error(msg);
    },
  });

  const canConfirmDelete = !!deleteProjectId && !deleteM.isPending;

  return (
    <PageShell
      title="Projects"
      subtitle={tenantSlug ? `Tenant: ${tenantSlug}` : "Tenant: —"}
      right={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => nav(`/t/${tenantSlug}/dashboard`)}
            className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
            disabled={!tenantSlug}
          >
            Back to Dashboard
          </button>

          {isTenantAdminUi ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
              disabled={!tenantSlug}
            >
              Create Project
            </button>
          ) : null}
        </div>
      }
    >
      {/* Loading/Error */}
      {projectsQ.isLoading ? (
        <div className="rounded-lg border bg-white p-6 text-sm">Loading projects...</div>
      ) : projectsQ.isError ? (
        <div className="rounded-lg border bg-white p-6 text-sm text-rose-600">
          Failed to load projects.
        </div>
      ) : null}

      {/* List */}
      {!projectsQ.isLoading && !projectsQ.isError ? (
        <div className="rounded-lg border bg-white">
          <div className="border-b p-4">
            <div className="text-sm font-semibold">Project List</div>
            <div className="text-xs text-slate-500">
              {projects.length ? `Total: ${projects.length}` : "No projects found."}
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">
              No projects found.
              {isTenantAdminUi ? (
                <span className="ml-2">
                  Click <span className="font-semibold">Create Project</span> to add one.
                </span>
              ) : null}
            </div>
          ) : (
            <div className="divide-y">
              {projects.map((p) => {
                const status = p.status ?? "active";
                const isArchived = String(status).toLowerCase() === "archived";

                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{p.title}</div>
                      {p.description ? (
                        <div className="mt-1 truncate text-xs text-slate-600">{p.description}</div>
                      ) : null}
                      <div className="mt-2 text-xs text-slate-500">
                        Status:{" "}
                        <span className={isArchived ? "text-slate-500" : "text-emerald-600"}>
                          {String(status)}
                        </span>
                      </div>
                    </div>

                    {isTenantAdminUi ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          disabled={updateM.isPending}
                          className="rounded-md border px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-60"
                          title="Edit title/description"
                        >
                          Edit
                        </button>

                        {isArchived ? (
                          <button
                            type="button"
                            onClick={() => unarchiveM.mutate(p.id)}
                            disabled={unarchiveM.isPending}
                            className="rounded-md border px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-60"
                            title="Unarchive project"
                          >
                            Unarchive
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => archiveM.mutate(p.id)}
                            disabled={archiveM.isPending}
                            className="rounded-md border px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-60"
                            title="Archive project"
                          >
                            Archive
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openDeleteModal(p)}
                          disabled={deleteM.isPending}
                          className="rounded-md border border-rose-200 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                          title="Delete project"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* ✅ Create modal */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => !createM.isPending && setCreateOpen(false)}
            aria-label="Close modal"
          />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">Create Project</div>
                <div className="mt-1 text-xs text-slate-500">
                  Tenant: <span className="font-medium">{tenantSlug || "—"}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !createM.isPending && setCreateOpen(false)}
                className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder='e.g. "Website Revamp"'
                  disabled={createM.isPending}
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                  className="w-full resize-none rounded-lg border px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short details about the project…"
                  rows={3}
                  disabled={createM.isPending}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                disabled={createM.isPending}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => createM.mutate()}
                disabled={!canSubmitCreate}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {createM.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ Edit modal */}
      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => !updateM.isPending && setEditOpen(false)}
            aria-label="Close modal"
          />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">Edit Project</div>
                <div className="mt-1 text-xs text-slate-500">
                  Tenant: <span className="font-medium">{tenantSlug || "—"}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !updateM.isPending && setEditOpen(false)}
                className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder='e.g. "Website Redesign"'
                  disabled={updateM.isPending}
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="w-full resize-none rounded-lg border px-3 py-2 text-sm"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Update project details…"
                  rows={3}
                  disabled={updateM.isPending}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={updateM.isPending}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!editProjectId) return;
                  updateM.mutate({
                    projectId: editProjectId,
                    title: editTitle,
                    description: editDescription,
                  });
                }}
                disabled={!canSubmitEdit}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {updateM.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ✅ Confirm Delete modal (same style) */}
      {confirmDeleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => !deleteM.isPending && closeDeleteModal()}
            aria-label="Close modal"
          />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-rose-600">Confirm Delete</div>
                <div className="mt-1 text-xs text-slate-500">
                  Tenant: <span className="font-medium">{tenantSlug || "—"}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => !deleteM.isPending && closeDeleteModal()}
                className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteProjectTitle || "this project"}</span>?
              <div className="mt-1 text-xs text-rose-700/80">
                This action cannot be undone.
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => closeDeleteModal()}
                disabled={deleteM.isPending}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!deleteProjectId) return;
                  deleteM.mutate(deleteProjectId);
                }}
                disabled={!canConfirmDelete}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-60"
              >
                {deleteM.isPending ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}