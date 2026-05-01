import { useMemo, useState } from "react";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useProjects, useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Plus, ArrowUpRight, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function AdminProjectsPage() {
  const { toast } = useToast();
  const list   = useProjects({ includeArchived: true });
  const update = useUpdateProject();
  const del    = useDeleteProject();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; slug: string } | null>(null);

  const featuredCount = (list.data || []).filter((p) => p.project.isFeatured).length;

  const items = useMemo(() =>
    (list.data || []).slice().sort((a, b) => {
      if (a.project.isFeatured !== b.project.isFeatured) return a.project.isFeatured ? -1 : 1;
      return new Date(b.project.updatedAt as any).getTime() - new Date(a.project.updatedAt as any).getTime();
    }),
    [list.data]
  );

  async function handleArchive(id: number, isArchived: boolean) {
    try {
      await update.mutateAsync({ id, updates: { isArchived: !isArchived } });
      toast({ title: isArchived ? "Restored" : "Archived" });
    } catch (e) { toast({ title: "Failed", description: (e as Error).message, variant: "destructive" }); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await del.mutateAsync(deleteTarget.id);
      toast({ title: "Deleted" });
      setDeleteTarget(null);
    } catch (e) { toast({ title: "Delete failed", description: (e as Error).message, variant: "destructive" }); }
  }

  async function toggleFeatured(id: number, next: boolean) {
    if (next && featuredCount >= 4) return toast({ title: "Featured limit reached (4/4)", variant: "destructive" });
    try {
      await update.mutateAsync({ id, updates: { isFeatured: next } });
    } catch (e) { toast({ title: "Update failed", description: (e as Error).message, variant: "destructive" }); }
  }

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold text-[hsl(var(--kesari))] uppercase tracking-wider mb-1">Admin</p>
              <h1 className="text-2xl font-bold">Projects</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/projects" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                View public <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/admin/projects/new"
                className="h-9 px-5 text-xs font-bold uppercase tracking-wider border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> New Project
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="border border-border">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <p className="text-sm font-bold">All Projects</p>
                <p className="text-xs text-muted-foreground mt-0.5">Featured: {featuredCount}/4</p>
              </div>
            </div>

            {list.isLoading ? (
              <div className="p-6 shimmer h-24" />
            ) : list.isError ? (
              <div className="p-6 text-sm text-muted-foreground">Failed to load.</div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-muted-foreground mb-4">No projects yet.</p>
                <Link
                  href="/admin/projects/new"
                  className="inline-flex items-center gap-1.5 h-9 px-5 text-xs font-bold uppercase tracking-wider border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Create first project
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((it) => {
                  const tr = it.translations.find((t: any) => t.language === "en") || it.translations[0] as any;
                  return (
                    <div key={it.project.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {it.project.isFeatured && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-[hsl(var(--kesari))]">★ Featured</span>
                          )}
                          {(it.project as any).isArchived && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5">Archived</span>
                          )}
                          <span className="text-xs text-muted-foreground font-mono">{it.project.slug}</span>
                        </div>
                        <p className="text-sm font-semibold truncate">{tr?.title || "Untitled"}</p>
                        {it.project.projectDate && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(it.project.projectDate as any).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => void toggleFeatured(it.project.id, !it.project.isFeatured)}
                          disabled={update.isPending}
                          className="h-8 px-3 text-xs font-bold uppercase tracking-wider border border-border bg-transparent hover:border-foreground transition-all disabled:opacity-50"
                        >
                          {it.project.isFeatured ? "Unfeature" : "Feature"}
                        </button>
                        <button
                          onClick={() => void handleArchive(it.project.id, !!(it.project as any).isArchived)}
                          disabled={update.isPending}
                          className="h-8 px-3 text-xs font-bold uppercase tracking-wider border border-border bg-transparent hover:border-foreground transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          {(it.project as any).isArchived
                            ? <><ArchiveRestore className="h-3 w-3" /> Restore</>
                            : <><Archive className="h-3 w-3" /> Archive</>}
                        </button>
                        <Link
                          href={`/admin/projects/${it.project.id}`}
                          className="h-8 px-3 text-xs font-bold uppercase tracking-wider border border-foreground bg-transparent hover:bg-foreground hover:text-background transition-all inline-flex items-center gap-1"
                        >
                          Edit <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget({ id: it.project.id, slug: it.project.slug })}
                          className="h-8 w-8 flex items-center justify-center border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </AdminShell>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.slug}"?`}
        description="This will permanently delete the project and all its translations. This cannot be undone."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={del.isPending}
      />
    </AdminGuard>
  );
}
