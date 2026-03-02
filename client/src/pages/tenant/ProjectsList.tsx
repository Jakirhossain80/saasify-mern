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

type ProjectsResponse = { items: ProjectItem[] } | { projects: ProjectItem[] } | ProjectItem[];

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

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === "object" && err !== null) {
    const e = err as {
      message?: unknown;
      response?: { data?: { message?: unknown } };
    };
    const apiMsg = e.response?.data?.message;
    if (typeof apiMsg === "string" && apiMsg.trim()) return apiMsg;
    if (typeof e.message === "string" && e.message.trim()) return e.message;
  }
  return fallback;
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status).toLowerCase();
  const isArchived = s === "archived";
  const isActive = s === "active";

  const cls = isActive
    ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-900/50"
    : isArchived
      ? "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
      : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  const dot = isActive
    ? "bg-emerald-500"
    : isArchived
      ? "bg-slate-400"
      : "bg-slate-400";

  const label = isActive ? "Active" : isArchived ? "Archived" : String(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}
      title={String(status)}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "back"
    | "add"
    | "edit"
    | "archive"
    | "unarchive"
    | "trash"
    | "folder"
    | "bolt"
    | "box";
  className?: string;
}) {
  // Simple inline SVGs (no dependencies)
  switch (name) {
    case "back":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "add":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "edit":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M12 20h9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "archive":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M21 8v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 3H2v5h20V3z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 12h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "unarchive":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 8v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 12v5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9.5 14.5L12 12l2.5 2.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "trash":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M3 6h18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "folder":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M3 7a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M13 2L3 14h7l-1 8 12-14h-7l-1-6z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "box":
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M21 8l-9-5-9 5 9 5 9-5z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M3 8v8l9 5 9-5V8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 13v8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
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

  const counts = useMemo(() => {
    let active = 0;
    let archived = 0;
    for (const p of projects) {
      const s = String(p.status ?? "active").toLowerCase();
      if (s === "archived") archived += 1;
      else active += 1;
    }
    return { total: projects.length, active, archived };
  }, [projects]);

  // ---------------------------
  // Create Project
  // ---------------------------
  const createM = useMutation({
    mutationFn: async () => {
      const payload: { title: string; description?: string } = { title: title.trim() };
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
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to create project."));
    },
  });

  const canSubmitCreate = title.trim().length > 1 && !createM.isPending;

  // ---------------------------
  // Edit Project (PATCH title/description)
  // ---------------------------
  const updateM = useMutation({
    mutationFn: async (input: { projectId: string; title: string; description: string }) => {
      const payload: { title: string; description: string } = {
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
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to update project."));
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
    onError: (err: unknown) => {
      toast.error(
        getErrorMessage(err, "Failed to archive project (check backend route).")
      );
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
    onError: (err: unknown) => {
      toast.error(
        getErrorMessage(err, "Failed to unarchive project (check backend route).")
      );
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
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, "Failed to delete project (check backend route)."));
    },
  });

  const canConfirmDelete = !!deleteProjectId && !deleteM.isPending;

  return (
    <PageShell
      title="Projects"
      subtitle={tenantSlug ? `Tenant: ${tenantSlug}` : "Tenant: —"}
      right={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={() => nav(`/t/${tenantSlug}/dashboard`)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            disabled={!tenantSlug}
          >
            <Icon name="back" className="h-5 w-5" />
            Back
          </button>

          {isTenantAdminUi ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              disabled={!tenantSlug}
            >
              <Icon name="add" className="h-5 w-5" />
              Create Project
            </button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-lg bg-slate-900/10 p-3 text-slate-900 dark:bg-white/10 dark:text-white">
              <Icon name="folder" className="h-7 w-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Projects
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {projectsQ.isLoading ? "…" : counts.total}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Icon name="bolt" className="h-7 w-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Active
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {projectsQ.isLoading ? "…" : counts.active}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-lg bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Icon name="archive" className="h-7 w-7" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Archived
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {projectsQ.isLoading ? "…" : counts.archived}
              </div>
            </div>
          </div>
        </div>

        {/* Loading/Error */}
        {projectsQ.isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-white" />
              <div className="font-medium text-slate-700 dark:text-slate-200">
                Loading projects...
              </div>
            </div>
          </div>
        ) : projectsQ.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
            Failed to load projects.
          </div>
        ) : null}

        {/* List */}
        {!projectsQ.isLoading && !projectsQ.isError ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-6 py-5 dark:border-slate-800 dark:bg-slate-800/40">
              <div>
                <div className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Project List
                </div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {projects.length ? `Total: ${projects.length}` : "No projects found."}
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Workspace Projects
                </span>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="p-10">
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white">
                    <Icon name="box" className="h-8 w-8" />
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                    No projects found
                  </div>
                  <div className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                    Start organizing your work by creating your very first project. It only takes a
                    few seconds.
                  </div>
                  <div className="mt-6 text-sm text-slate-600 dark:text-slate-300">
                    {isTenantAdminUi ? (
                      <>
                        Click <span className="font-semibold">Create Project</span> to add one.
                      </>
                    ) : (
                      "Ask a tenant admin to create a project."
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                      <th className="px-6 py-4">Project Name</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {projects.map((p) => {
                      const status = p.status ?? "active";
                      const isArchived = String(status).toLowerCase() === "archived";

                      return (
                        <tr
                          key={p.id}
                          className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-6 py-5 align-top">
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {p.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              ID: <span className="font-mono">{p.id}</span>
                            </div>
                          </td>

                          <td className="px-6 py-5 align-top">
                            {p.description ? (
                              <div className="max-w-xl text-sm text-slate-500 line-clamp-2 dark:text-slate-400">
                                {p.description}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-400 dark:text-slate-500">—</div>
                            )}
                          </td>

                          <td className="px-6 py-5 align-top">
                            <StatusBadge status={String(status)} />
                          </td>

                          <td className="px-6 py-5 align-top">
                            {isTenantAdminUi ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(p)}
                                  disabled={updateM.isPending}
                                  className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                                  title="Edit title/description"
                                >
                                  <Icon name="edit" className="h-5 w-5" />
                                </button>

                                {isArchived ? (
                                  <button
                                    type="button"
                                    onClick={() => unarchiveM.mutate(p.id)}
                                    disabled={unarchiveM.isPending}
                                    className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                                    title="Unarchive project"
                                  >
                                    <Icon name="unarchive" className="h-5 w-5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => archiveM.mutate(p.id)}
                                    disabled={archiveM.isPending}
                                    className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                                    title="Archive project"
                                  >
                                    <Icon name="archive" className="h-5 w-5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => openDeleteModal(p)}
                                  disabled={deleteM.isPending}
                                  className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-rose-900/20 dark:hover:text-rose-300"
                                  title="Delete project"
                                >
                                  <Icon name="trash" className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-right text-sm text-slate-400 dark:text-slate-500">
                                —
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {/* ✅ Create modal */}
        {createOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !createM.isPending && setCreateOpen(false)}
              aria-label="Close modal"
            />

            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-6 dark:border-slate-800">
                <div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Create New Project
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Tenant: <span className="font-semibold">{tenantSlug || "—"}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !createM.isPending && setCreateOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  disabled={createM.isPending}
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 p-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Project Name
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='e.g. "Website Revamp"'
                    disabled={createM.isPending}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Description (optional)
                  </label>
                  <textarea
                    className="min-h-[100px] w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe the project goals..."
                    rows={3}
                    disabled={createM.isPending}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    disabled={createM.isPending}
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => createM.mutate()}
                    disabled={!canSubmitCreate}
                    className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {createM.isPending ? "Creating..." : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ✅ Edit modal */}
        {editOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !updateM.isPending && setEditOpen(false)}
              aria-label="Close modal"
            />

            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-6 dark:border-slate-800">
                <div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Edit Project
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Tenant: <span className="font-semibold">{tenantSlug || "—"}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !updateM.isPending && setEditOpen(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  disabled={updateM.isPending}
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 p-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Project Name
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder='e.g. "Website Redesign"'
                    disabled={updateM.isPending}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    className="min-h-[100px] w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Update project details…"
                    rows={3}
                    disabled={updateM.isPending}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    disabled={updateM.isPending}
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
                    className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {updateM.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ✅ Confirm Delete modal */}
        {confirmDeleteOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => !deleteM.isPending && closeDeleteModal()}
              aria-label="Close modal"
            />

            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                  <Icon name="trash" className="h-8 w-8" />
                </div>

                <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Delete Project
                </div>

                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete{" "}
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {deleteProjectTitle || "this project"}
                  </span>
                  ? This action cannot be undone.
                </div>

                <div className="mt-7 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!deleteProjectId) return;
                      deleteM.mutate(deleteProjectId);
                    }}
                    disabled={!canConfirmDelete}
                    className="w-full rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/15 hover:bg-rose-700 disabled:opacity-60"
                  >
                    {deleteM.isPending ? "Deleting..." : "Yes, Delete"}
                  </button>

                  <button
                    type="button"
                    onClick={() => closeDeleteModal()}
                    disabled={deleteM.isPending}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
