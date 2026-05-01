import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ProjectGetResponse, type ProjectListResponse } from "@shared/routes";
import type { CreateProjectRequest, UpdateProjectRequest, UpsertProjectTranslationRequest } from "@shared/schema";
import { parseWithLogging } from "./_parse";

export function useProjects(params?: { lang?: "en" | "hi" | "mr"; featured?: "true" | "false"; includeArchived?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.lang) qs.set("lang", params.lang);
  if (params?.featured) qs.set("featured", params.featured);
  if (params?.includeArchived) qs.set("includeArchived", "true");
  const url = `${api.projects.list.path}${qs.toString() ? `?${qs.toString()}` : ""}`;

  return useQuery<ProjectListResponse>({
    queryKey: [api.projects.list.path, params?.lang || "", params?.featured || "", params?.includeArchived ? "all" : ""],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.projects.list.responses[200], await res.json(), "projects.list 200");
    },
  });
}

export function useProject(id: number, params?: { lang?: "en" | "hi" | "mr" }) {
  const qs = new URLSearchParams();
  if (params?.lang) qs.set("lang", params.lang);
  const url = `${buildUrl(api.projects.get.path, { id })}${qs.toString() ? `?${qs.toString()}` : ""}`;

  return useQuery<ProjectGetResponse>({
    queryKey: [api.projects.get.path, id, params?.lang || "en"],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null as unknown as ProjectGetResponse;
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.projects.get.responses[200], await res.json(), "projects.get 200");
    },
    refetchOnMount: "stale",
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectRequest) => {
      const validated = api.projects.create.input.parse(input);
      const res = await fetch(api.projects.create.path, {
        method: api.projects.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (res.status === 400) {
        const e = parseWithLogging(api.projects.create.responses[400], await res.json(), "projects.create 400");
        throw new Error(e.message);
      }
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.projects.create.responses[201], await res.json(), "projects.create 201");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.projects.list.path] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateProjectRequest }) => {
      const validated = api.projects.update.input.parse(updates);
      const url = buildUrl(api.projects.update.path, { id });
      const res = await fetch(url, {
        method: api.projects.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (res.status === 400) {
        const e = parseWithLogging(api.projects.update.responses[400], await res.json(), "projects.update 400");
        throw new Error(e.message);
      }
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (res.status === 404) {
        const e = parseWithLogging(api.projects.update.responses[404], await res.json(), "projects.update 404");
        throw new Error(e.message);
      }
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.projects.update.responses[200], await res.json(), "projects.update 200");
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [api.projects.list.path] });
      qc.invalidateQueries({ queryKey: [api.projects.get.path, vars.id], exact: false });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl("/api/projects/:id", { id }), {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (res.status === 404) throw new Error("Not found");
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.projects.list.path] }),
  });
}

export function useUpsertProjectTranslation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      lang,
      input,
    }: {
      id: number;
      lang: "en" | "hi" | "mr";
      input: UpsertProjectTranslationRequest;
    }) => {
      const validated = api.projects.upsertTranslation.input.parse(input);
      const url = buildUrl(api.projects.upsertTranslation.path, { id, lang });
      const res = await fetch(url, {
        method: api.projects.upsertTranslation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (res.status === 400) {
        const e = parseWithLogging(api.projects.upsertTranslation.responses[400], await res.json(), "projects.upsertTranslation 400");
        throw new Error(e.message);
      }
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (res.status === 404) {
        const e = parseWithLogging(api.projects.upsertTranslation.responses[404], await res.json(), "projects.upsertTranslation 404");
        throw new Error(e.message);
      }
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.projects.upsertTranslation.responses[200], await res.json(), "projects.upsertTranslation 200");
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [api.projects.list.path] });
      qc.invalidateQueries({ queryKey: [api.projects.get.path, vars.id], exact: false });
    },
  });
}
