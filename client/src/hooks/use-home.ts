import { useQuery } from "@tanstack/react-query";
import { api, type HomeFeaturedResponse } from "@shared/routes";
import { parseWithLogging } from "./_parse";

export function useHomeFeatured(params?: { lang?: "en" | "hi" | "mr" }) {
  const qs = new URLSearchParams();
  if (params?.lang) qs.set("lang", params.lang);
  const url = `${api.home.featured.path}${qs.toString() ? `?${qs.toString()}` : ""}`;

  return useQuery<HomeFeaturedResponse>({
    queryKey: [api.home.featured.path, params?.lang || ""],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return parseWithLogging(api.home.featured.responses[200], await res.json(), "home.featured 200");
    },
  });
}
