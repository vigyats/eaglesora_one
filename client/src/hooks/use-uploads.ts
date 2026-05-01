import { useMutation } from "@tanstack/react-query";
import type { UploadUrlResponse } from "@shared/schema";

export function useRequestUploadUrl() {
  return useMutation({
    mutationFn: async (input: { name: string; size?: number; contentType?: string; file: File }): Promise<UploadUrlResponse> => {
      const form = new FormData();
      form.append("file", input.file, input.name);
      const res = await fetch("/api/uploads/request-url", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return res.json();
    },
  });
}

// kept for backward compat — no-op since upload is now server-proxied
export async function uploadToPresignedUrl(_file: File, _uploadURL: string) {}
