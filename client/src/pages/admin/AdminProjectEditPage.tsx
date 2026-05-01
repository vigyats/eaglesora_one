import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useProject, useUpdateProject, useUpsertProjectTranslation, useProjects } from "@/hooks/use-projects";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Star, Upload, X, ImagePlus, Languages } from "lucide-react";
import { TranslationReviewDialog, type TranslationReviewFields } from "@/components/TranslationReviewDialog";
import { useRequestUploadUrl } from "@/hooks/use-uploads";

function ImageUploadField({ value, onChange, label }: { value: string | null; onChange: (v: string | null) => void; label: string }) {
  const { toast } = useToast();
  const requestUrl = useRequestUploadUrl();
  const [busy, setBusy] = useState(false);
  async function handleFile(file: File) {
    setBusy(true);
    try {
      const resp = await requestUrl.mutateAsync({ file, name: file.name, size: file.size, contentType: file.type || "image/jpeg" });
      onChange(resp.objectPath);
      toast({ title: "Uploaded" });
    } catch (e) { toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">{label}</label>
      <div className="border rounded-lg overflow-hidden">
        {value ? (
          <div className="relative">
            <img src={value} alt={label} className="w-full h-48 object-cover" />
            <button onClick={() => onChange(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 cursor-pointer bg-muted/40 hover:bg-muted/60 transition-colors">
            <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">{busy ? "Uploading..." : "Click to upload"}</span>
            <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.currentTarget.value = ""; }} />
          </label>
        )}
      </div>
    </div>
  );
}

function GalleryUploadField({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const { toast } = useToast();
  const requestUrl = useRequestUploadUrl();
  const [busy, setBusy] = useState(false);
  async function handleFiles(files: FileList) {
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const resp = await requestUrl.mutateAsync({ file, name: file.name, size: file.size, contentType: file.type || "image/jpeg" });
        uploaded.push(resp.objectPath);
      }
      onChange([...values, ...uploaded]);
      toast({ title: `${uploaded.length} image(s) uploaded` });
    } catch (e) { toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block">Gallery Images</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {values.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"><X className="w-3 h-3" /></button>
          </div>
        ))}
        <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors">
          <Upload className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-xs text-muted-foreground">{busy ? "..." : "Add"}</span>
          <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={(e) => { if (e.target.files?.length) void handleFiles(e.target.files); e.currentTarget.value = ""; }} />
        </label>
      </div>
    </div>
  );
}

export default function AdminProjectEditPage() {
  const params = useParams() as { id?: string };
  const id = Number(params.id);
  const { toast } = useToast();

  const all = useProjects({});
  const featuredCount = useMemo(() => (all.data || []).filter((p) => p.project.isFeatured).length, [all.data]);

  const q = useProject(id, {});
  const upd = useUpdateProject();
  const upsertTr = useUpsertProjectTranslation();

  const [slug, setSlug] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [projectDate, setProjectDate] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [reviewOpen, setReviewOpen] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const data: any = q.data;
    if (!data?.project || initialized.current) return;
    initialized.current = true;
    setSlug(data.project.slug || "");
    setIsFeatured(Boolean(data.project.isFeatured));
    setCover(data.project.coverImagePath ?? null);
    setGallery(data.project.galleryImages || []);
    setYoutubeUrl(data.project.youtubeUrl || "");
    setProjectDate(data.project.projectDate ? new Date(data.project.projectDate).toISOString().slice(0, 10) : "");
    const tr = (data.translations || []).find((t: any) => t.language === "en") || data.translations?.[0];
    if (tr) { setTitle(tr.title || ""); setSummary(tr.summary || ""); setContentHtml(tr.contentHtml || ""); setStatus(tr.status || "published"); }
  }, [q.data]);

  async function saveBasics() {
    if (!slug.trim()) return toast({ title: "Slug required", variant: "destructive" });
    if (!projectDate) return toast({ title: "Date required", variant: "destructive" });
    try {
      await upd.mutateAsync({ id, updates: { slug: slug.trim(), isFeatured, coverImagePath: cover, youtubeUrl: youtubeUrl.trim() || null, galleryImages: gallery, projectDate } });
      toast({ title: "Saved" });
    } catch (e) { toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" }); }
  }

  async function saveContent() {
    if (!title.trim()) return toast({ title: "Title required", variant: "destructive" });
    try {
      await upsertTr.mutateAsync({ id, lang: "en", input: { language: "en", status, title: title.trim(), summary: summary.trim() || null, contentHtml } });
      toast({ title: "Saved" });
    } catch (e) { toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" }); }
  }

  function getReviewTranslations(): TranslationReviewFields[] {
    const data: any = q.data;
    const stored: TranslationReviewFields[] = (data?.translations || []).map((t: any) => ({
      language: t.language,
      status: t.status,
      title: t.title || "",
      summary: t.summary ?? null,
      contentHtml: t.contentHtml || "",
    }));
    // Overlay current EN form state
    const enIdx = stored.findIndex((t) => t.language === "en");
    const enEntry: TranslationReviewFields = { language: "en", status, title: title.trim(), summary: summary.trim() || null, contentHtml };
    if (enIdx >= 0) stored[enIdx] = enEntry; else stored.push(enEntry);
    return stored;
  }

  async function handleReviewSave(lang: "en" | "hi" | "mr", fields: TranslationReviewFields) {
    await upsertTr.mutateAsync({
      id,
      lang,
      input: { language: lang, status: fields.status ?? status, title: fields.title, summary: fields.summary ?? null, contentHtml: fields.contentHtml },
    });
  }

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp pb-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to projects
            </Link>
            <Link href={`/projects/${id}`} className="text-sm font-semibold text-primary hover:underline">View public</Link>
          </div>

          {q.isLoading ? <div className="h-40 shimmer rounded-lg" /> : q.isError || !(q.data as any)?.project ? (
            <p className="text-muted-foreground">Project not found.</p>
          ) : (
            <div className="space-y-6">
              {/* Basics */}
              <div className="rounded-lg border bg-card p-6 space-y-5">
                <h2 className="font-bold text-lg">Basics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Slug *</label>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">Project Date *</label>
                    <Input type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">YouTube URL (optional)</label>
                  <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/40" onClick={() => {
                  if (!isFeatured && featuredCount >= 4) return toast({ title: "Featured limit reached (4/4)", variant: "destructive" });
                  setIsFeatured(v => !v);
                }}>
                  <Star className={`h-5 w-5 ${isFeatured ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
                  <div>
                    <div className="text-sm font-semibold">Featured ({featuredCount}/4)</div>
                    <div className="text-xs text-muted-foreground">Show on home page</div>
                  </div>
                  <div className={`ml-auto w-10 h-5 rounded-full transition-colors ${isFeatured ? "bg-yellow-500" : "bg-muted"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isFeatured ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </div>
                <ImageUploadField value={cover} onChange={setCover} label="Cover Image" />
                <GalleryUploadField values={gallery} onChange={setGallery} />
                <Button onClick={() => void saveBasics()} disabled={upd.isPending} className="w-full h-11 bg-white text-black border border-black hover:bg-black hover:text-white transition-colors">
                  <Save className="mr-2 h-4 w-4" />{upd.isPending ? "Saving…" : "Save Basics"}
                </Button>
              </div>

              {/* Content */}
              <div className="rounded-lg border bg-card p-6 space-y-5">
                <h2 className="font-bold text-lg">Content</h2>
                <div className="flex gap-2">
                  {(["draft", "published"] as const).map(s => (
                    <button key={s} onClick={() => setStatus(s)}
                      className={`flex-1 h-9 text-xs font-bold capitalize rounded border transition-colors ${status === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Title *</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Summary (optional)</label>
                  <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="One-line description" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5">Content</label>
                  <RichTextEditor value={contentHtml} onChange={setContentHtml} placeholder="Write content here..." />
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => void saveContent()} disabled={upsertTr.isPending} className="flex-1 h-11 bg-white text-black border border-black hover:bg-black hover:text-white transition-colors">
                    <Save className="mr-2 h-4 w-4" />{upsertTr.isPending ? "Saving…" : "Save EN"}
                  </Button>
                  <Button onClick={() => setReviewOpen(true)} variant="outline" className="h-11 px-4" title="Review all translations">
                    <Languages className="h-4 w-4 mr-2" /> Review Translations
                  </Button>
                </div>

                <TranslationReviewDialog
                  open={reviewOpen}
                  onClose={() => setReviewOpen(false)}
                  translations={getReviewTranslations()}
                  onSave={handleReviewSave}
                  variant="edit"
                  mode="project"
                />
              </div>
            </div>
          )}
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
