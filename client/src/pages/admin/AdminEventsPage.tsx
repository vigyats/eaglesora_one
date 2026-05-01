import { useMemo, useState } from "react";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useEvents, useUpdateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { Plus, ArrowUpRight, Archive, ArchiveRestore, Trash2, CalendarDays } from "lucide-react";
import { Link } from "wouter";

export default function AdminEventsPage() {
  const { toast } = useToast();
  const list   = useEvents({ includeArchived: true });
  const update = useUpdateEvent();
  const del    = useDeleteEvent();
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; slug: string } | null>(null);

  const items = useMemo(() =>
    (list.data || []).slice().sort((a, b) =>
      new Date(b.event.updatedAt as any).getTime() - new Date(a.event.updatedAt as any).getTime()
    ),
    [list.data]
  );

  async function handleArchive(id: number, isArchived: boolean) {
    try {
      await update.mutateAsync({ id, updates: { isArchived: !isArchived } as any });
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

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold text-[hsl(var(--kesari))] uppercase tracking-wider mb-1">Admin</p>
              <h1 className="text-2xl font-bold">Events</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/events" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                View public <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/admin/events/new"
                className="h-9 px-5 text-xs font-bold uppercase tracking-wider border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> New Event
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="border border-border">
            <div className="px-5 py-4 border-b border-border bg-muted/20">
              <p className="text-sm font-bold">All Events</p>
            </div>

            {list.isLoading ? (
              <div className="p-6 shimmer h-24" />
            ) : list.isError ? (
              <div className="p-6 text-sm text-muted-foreground">Failed to load.</div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-muted-foreground mb-4">No events yet.</p>
                <Link
                  href="/admin/events/new"
                  className="inline-flex items-center gap-1.5 h-9 px-5 text-xs font-bold uppercase tracking-wider border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Create first event
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {items.map((it) => {
                  const tr = it.translations.find((t: any) => t.language === "en") || it.translations[0] as any;
                  return (
                    <div key={it.event.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {(it.event as any).isArchived && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5">Archived</span>
                          )}
                          <span className="text-xs text-muted-foreground font-mono">{it.event.slug}</span>
                        </div>
                        <p className="text-sm font-semibold truncate">{tr?.title || "Untitled"}</p>
                        {it.event.startDate && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(it.event.startDate as any).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => void handleArchive(it.event.id, !!(it.event as any).isArchived)}
                          disabled={update.isPending}
                          className="h-8 px-3 text-xs font-bold uppercase tracking-wider border border-border bg-transparent hover:border-foreground transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          {(it.event as any).isArchived
                            ? <><ArchiveRestore className="h-3 w-3" /> Restore</>
                            : <><Archive className="h-3 w-3" /> Archive</>}
                        </button>
                        <Link
                          href={`/admin/events/${it.event.id}`}
                          className="h-8 px-3 text-xs font-bold uppercase tracking-wider border border-foreground bg-transparent hover:bg-foreground hover:text-background transition-all inline-flex items-center gap-1"
                        >
                          Edit <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget({ id: it.event.id, slug: it.event.slug })}
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
        description="This will permanently delete the event and all registrations. This cannot be undone."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={del.isPending}
      />
    </AdminGuard>
  );
}
