import { useState } from "react";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

export default function AdminYouTubePage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const { data: videos = [], isLoading } = useQuery<{ id: number; url: string; title: string }[]>({
    queryKey: ["/api/youtube-videos"],
    queryFn: () => fetch("/api/youtube-videos").then(r => r.json()),
  });

  const add = useMutation({
    mutationFn: () =>
      fetch("/api/youtube-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title }),
      }).then(async r => {
        if (!r.ok) throw new Error((await r.json()).message);
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/youtube-videos"] });
      setUrl(""); setTitle("");
      toast({ title: "Video added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/youtube-videos/${id}`, { method: "DELETE" }).then(r => {
        if (!r.ok) throw new Error("Failed");
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/youtube-videos"] });
      toast({ title: "Video removed" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete", variant: "destructive" }),
  });

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp space-y-6">
          <div>
            <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-1 whitespace-nowrap">Admin</p>
            <h1 className="text-3xl font-bold tracking-tight">YouTube Videos</h1>
            <p className="text-sm text-muted-foreground mt-1">These appear on the homepage above the footer.</p>
          </div>

          {/* Add form */}
          <div className="border border-border bg-card p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider">Add Video</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Video title"
                className="h-10 px-3 border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--kesari))]"
              />
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="YouTube URL (e.g. https://youtu.be/...)"
                className="h-10 px-3 border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--kesari))]"
              />
            </div>
            <button
              disabled={!url.trim() || !title.trim() || add.isPending}
              onClick={() => add.mutate()}
              className="inline-flex items-center gap-2 h-9 px-5 bg-[hsl(var(--kesari))] text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" /> Add Video
            </button>
          </div>

          {/* List */}
          <div className="border border-border bg-card divide-y divide-border">
            {isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading...</div>
            ) : videos.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground flex items-center gap-2">
                <Youtube className="h-4 w-4" /> No videos yet. Add one above.
              </div>
            ) : (
              videos.map(v => {
                const thumbId = getYouTubeId(v.url);
                return (
                  <div key={v.id} className="flex items-center gap-4 p-4">
                    {thumbId ? (
                      <img
                        src={`https://img.youtube.com/vi/${thumbId}/mqdefault.jpg`}
                        alt={v.title}
                        className="w-28 h-16 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-28 h-16 bg-muted rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{v.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{v.url}</p>
                    </div>
                    <button
                      onClick={() => remove.mutate(v.id)}
                      disabled={remove.isPending}
                      className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive border border-border hover:border-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
