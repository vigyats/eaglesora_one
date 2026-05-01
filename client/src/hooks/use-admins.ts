import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateAdminRequest, UpdateAdminRequest } from "@shared/schema";
import { parseWithLogging } from "./_parse";

export function useAdminMe() {
  return useQuery({
    queryKey: [api.admins.me.path],
    queryFn: async () => {
      const res = await fetch(api.admins.me.path, { credentials: "include" });
      if (res.status === 401) {
        return parseWithLogging(api.admins.me.responses[401], await res.json(), "admins.me 401") as never;
      }
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.admins.me.responses[200], await res.json(), "admins.me 200");
    },
    retry: false,
  });
}

export function useAdmins() {
  return useQuery({
    queryKey: [api.admins.list.path],
    queryFn: async () => {
      const res = await fetch(api.admins.list.path, { credentials: "include" });
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.admins.list.responses[200], await res.json(), "admins.list 200");
    },
  });
}

export function useCreateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAdminRequest) => {
      const validated = api.admins.create.input.parse(input);
      const res = await fetch(api.admins.create.path, {
        method: api.admins.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (res.status === 400) {
        const e = parseWithLogging(api.admins.create.responses[400], await res.json(), "admins.create 400");
        throw new Error(e.message);
      }
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.admins.create.responses[201], await res.json(), "admins.create 201");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.admins.list.path] }),
  });
}

export function useUpdateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateAdminRequest }) => {
      const validated = api.admins.update.input.parse(updates);
      const url = buildUrl(api.admins.update.path, { id });
      const res = await fetch(url, {
        method: api.admins.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (res.status === 400) {
        const e = parseWithLogging(api.admins.update.responses[400], await res.json(), "admins.update 400");
        throw new Error(e.message);
      }
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (res.status === 403) throw new Error("403: Forbidden");
      if (res.status === 404) {
        const e = parseWithLogging(api.admins.update.responses[404], await res.json(), "admins.update 404");
        throw new Error(e.message);
      }
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.admins.update.responses[200], await res.json(), "admins.update 200");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [api.admins.list.path] });
      qc.invalidateQueries({ queryKey: [api.admins.me.path] });
    },
  });
}
