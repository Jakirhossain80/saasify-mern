// FILE: client/src/pages/tenant/ProjectsList.tsx
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import PageShell from "../../components/common/PageShell";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";
import { useAuthStore } from "../../store/auth.store";

type ProjectStatus = "active" | "archived";

type ProjectItem = {
  id?: string;
  _id?: string;
  title?: string;
  description?: string;
  status?: ProjectStatus;
};

type ProjectsResponse =
  | { items?: ProjectItem[]; projects?: ProjectItem[] }
  | ProjectItem[];

type CreateProjectResponse = {
  project?: {
    id?: string;
    _id?: string;
    title?: string;
    description?: string;
    status?: ProjectStatus;
  };
};

function normalizeProjects(data: ProjectsResponse | undefined): Required<ProjectItem>[] {
  if (!data) return [];

  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.projects)
        ? data.projects
        : [];

  return raw.map((item) => ({
    id: item.id ?? item._id ?? "",
    _id: item._id ?? item.id ?? "",
    title: item.title ?? "Untitled Project",
    description: item.description ?? "",
    status: item.status ?? "active",
  }));
}

function shortText(text: string, max = 60) {
  if (!text) return "—";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

export default function ProjectsList() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const { tenantSlug = "" } = useParams();
  const activeTenantRole = useAuthStore((s) => s.activeTenantRole);

  const [searchParams, setSearchParams] = useSearchParams();

  const isTenantAdmin = activeTenantRole === "tenantAdmin";

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const shouldOpenCreateFromQuery = useMemo(
    () => searchParams.get("new") === "1",
    [searchParams]
  );

  useEffect(() => {
    if (!isTenantAdmin) return;

    if (shouldOpenCreateFromQuery) {
      setIsCreateOpen(true);

      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  }, [isTenantAdmin, searchParams, setSearchParams, shouldOpenCreateFromQuery]);

  const projectsQ = useQuery({
    queryKey: ["tenantProjects", tenantSlug],
    queryFn: async () => {
      const { data } = await http.get<ProjectsResponse>(API.tenant.projects(tenantSlug));
      return data;
    },
    enabled: !!tenantSlug,
    retry: 1,
  });

  const createProjectMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string }) => {
      const { data } = await http.post<CreateProjectResponse>(
        API.tenant.projects(tenantSlug),
        payload
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Project created successfully");
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["tenantProjects", tenantSlug] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create project");
    },
  });

  const projects = normalizeProjects(projectsQ.data);
  const total = projects.length;
  const activeCount = projects.filter((p) => p.status === "active").length;
  const archivedCount = projects.filter((p) => p.status === "archived").length;

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      toast.error("Project title is required");
      return;
    }

    createProjectMutation.mutate({
      title: trimmedTitle,
      description: trimmedDescription || undefined,
    });
  };

  return (
    <>
      <PageShell
        title="Projects"
        subtitle={`Tenant: ${tenantSlug}`}
        right={
          <div className="flex items-center gap-2">
            {isTenantAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                + Create Project
              </button>
            )}

            <button
              onClick={() => nav(-1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
            >
              ← Back
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Projects</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{total}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Active</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Archived</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
              {archivedCount}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Project List</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Total: {total}</p>
            </div>

            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
              WORKSPACE PROJECTS
            </span>
          </div>

          {projectsQ.isLoading ? (
            <div className="p-6 text-sm text-slate-600 dark:text-slate-400">Loading projects…</div>
          ) : projectsQ.isError ? (
            <div className="p-6 text-sm text-rose-600 dark:text-rose-300">
              Failed to load projects.
            </div>
          ) : projects.length === 0 ? (
            <div className="p-6 text-sm text-slate-600 dark:text-slate-400">No projects found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Project Name
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Description
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <Link
                            to={`/t/${tenantSlug}/projects/${project.id}`}
                            className="text-base font-bold text-slate-900 hover:underline dark:text-slate-100"
                          >
                            {project.title}
                          </Link>
                          <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            ID: {project.id}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-slate-700 dark:text-slate-300">
                        {shortText(project.description, 70)}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                            project.status === "archived"
                              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
                          ].join(" ")}
                        >
                          {project.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          to={`/t/${tenantSlug}/projects/${project.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageShell>

      {/* Create Project Modal */}
      {isTenantAdmin && isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Create Project
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tenant: {tenantSlug}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!createProjectMutation.isPending) {
                    setIsCreateOpen(false);
                  }
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="project-title"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Project Title
                </label>
                <input
                  id="project-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter project title"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  maxLength={120}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Description
                </label>
                <textarea
                  id="project-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter project description"
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  maxLength={2000}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createProjectMutation.isPending}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

