// FILE: client/src/pages/tenant/ProjectDetails.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PageShell from "../../components/common/PageShell";
import { http } from "../../api/http";
import { API } from "../../api/endpoints";

type ProjectStatus = "active" | "archived";

type ProjectDetailsResponse = {
  item?: {
    id?: string;
    _id?: string;
    title?: string;
    description?: string;
    status?: ProjectStatus;
    createdAt?: string;
    updatedAt?: string;
  };
  project?: {
    id?: string;
    _id?: string;
    title?: string;
    description?: string;
    status?: ProjectStatus;
    createdAt?: string;
    updatedAt?: string;
  };
  id?: string;
  _id?: string;
  title?: string;
  description?: string;
  status?: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
};

function normalizeProject(data: ProjectDetailsResponse | undefined) {
  if (!data) return null;

  const src = data.item ?? data.project ?? data;

  return {
    id: src.id ?? src._id ?? "",
    title: src.title ?? "Untitled Project",
    description: src.description ?? "No description available.",
    status: src.status ?? "active",
    createdAt: src.createdAt ?? "",
    updatedAt: src.updatedAt ?? "",
  };
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function ProjectDetails() {
  const nav = useNavigate();
  const { tenantSlug = "", projectId = "" } = useParams();

  const projectQ = useQuery({
    queryKey: ["tenantProjectDetails", tenantSlug, projectId],
    queryFn: async () => {
      const { data } = await http.get<ProjectDetailsResponse>(
        API.tenant.projectById(tenantSlug, projectId)
      );
      return data;
    },
    enabled: !!tenantSlug && !!projectId,
    retry: 1,
  });

  const project = normalizeProject(projectQ.data);

  if (projectQ.isLoading) {
    return (
      <PageShell title="Project Details" subtitle="Loading project...">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="h-6 w-48 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="mt-4 h-24 rounded bg-slate-50 dark:bg-slate-950" />
        </div>
      </PageShell>
    );
  }

  if (projectQ.isError || !project) {
    return (
      <PageShell title="Project Details" subtitle={`Tenant: ${tenantSlug}`}>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm dark:border-rose-900/40 dark:bg-rose-900/20">
          <p className="text-sm text-rose-700 dark:text-rose-200">
            Failed to load project details.
          </p>

          <div className="mt-4">
            <button
              onClick={() => nav(`/t/${tenantSlug}/projects`)}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={project.title}
      subtitle={`Tenant: ${tenantSlug}`}
      right={
        <button
          onClick={() => nav(`/t/${tenantSlug}/projects`)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
        >
          ← Back
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {project.title}
            </h2>

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
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Created
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {formatDate(project.createdAt)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Updated
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {formatDate(project.updatedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Full Description
          </h3>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
              {project.description}
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

