import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type EventGetResponse, type EventListResponse } from "@shared/routes";
import type { CreateEventRequest, UpdateEventRequest, UpsertEventTranslationRequest } from "@shared/schema";
import { parseWithLogging } from "./_parse";

export function useEvents(params?: { lang?: "en" | "hi" | "mr"; includeArchived?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.lang) qs.set("lang", params.lang);
  if (params?.includeArchived) qs.set("includeArchived", "true");
  const url = `${api.events.list.path}${qs.toString() ? `?${qs.toString()}` : ""}`;

  return useQuery<EventListResponse>({
    queryKey: [api.events.list.path, params?.lang || "en", params?.includeArchived ? "all" : ""],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.events.list.responses[200], await res.json(), "events.list 200");
    },
    refetchOnMount: "stale",
  });
}

export function useEvent(id: number, params?: { lang?: "en" | "hi" | "mr" }) {
  const qs = new URLSearchParams();
  if (params?.lang) qs.set("lang", params.lang);
  const url = `${buildUrl(api.events.get.path, { id })}${qs.toString() ? `?${qs.toString()}` : ""}`;

  return useQuery<EventGetResponse>({
    queryKey: [api.events.get.path, id, params?.lang || "en"],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null as unknown as EventGetResponse;
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.events.get.responses[200], await res.json(), "events.get 200");
    },
    refetchOnMount: "stale",
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEventRequest) => {
      const validated = api.events.create.input.parse(input);
      const res = await fetch(api.events.create.path, {
        method: api.events.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (res.status === 400) {
        const e = parseWithLogging(api.events.create.responses[400], await res.json(), "events.create 400");
        throw new Error(e.message);
      }
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.events.create.responses[201], await res.json(), "events.create 201");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.events.list.path] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateEventRequest }) => {
      const validated = api.events.update.input.parse(updates);
      const url = buildUrl(api.events.update.path, { id });
      const res = await fetch(url, {
        method: api.events.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (res.status === 400) {
        const e = parseWithLogging(api.events.update.responses[400], await res.json(), "events.update 400");
        throw new Error(e.message);
      }
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (res.status === 404) {
        const e = parseWithLogging(api.events.update.responses[404], await res.json(), "events.update 404");
        throw new Error(e.message);
      }
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.events.update.responses[200], await res.json(), "events.update 200");
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [api.events.list.path] });
      qc.invalidateQueries({ queryKey: [api.events.get.path, vars.id], exact: false });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl("/api/events/:id", { id }), {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (res.status === 404) throw new Error("Not found");
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.events.list.path] }),
  });
}

export function useUpsertEventTranslation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      lang,
      input,
    }: {
      id: number;
      lang: "en" | "hi" | "mr";
      input: UpsertEventTranslationRequest;
    }) => {
      const validated = api.events.upsertTranslation.input.parse(input);
      const url = buildUrl(api.events.upsertTranslation.path, { id, lang });
      const res = await fetch(url, {
        method: api.events.upsertTranslation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (res.status === 400) {
        const e = parseWithLogging(api.events.upsertTranslation.responses[400], await res.json(), "events.upsertTranslation 400");
        throw new Error(e.message);
      }
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (res.status === 404) {
        const e = parseWithLogging(api.events.upsertTranslation.responses[404], await res.json(), "events.upsertTranslation 404");
        throw new Error(e.message);
      }
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.events.upsertTranslation.responses[200], await res.json(), "events.upsertTranslation 200");
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [api.events.list.path] });
      qc.invalidateQueries({ queryKey: [api.events.get.path, vars.id], exact: false });
    },
  });
}
