import { useEffect } from "react";

export function usePageTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `Prayas Yavatmal | ${page}` : "Prayas Yavatmal";
  }, [page]);
}
