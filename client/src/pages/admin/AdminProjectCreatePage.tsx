import { useState } from "react";
import { useLocation } from "wouter";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useCreateProject, useProjects } from "@/hooks/use-projects";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { CoverImageField } from "@/components/CoverImageField";
import { MediaGalleryUpload } from "@/components/MediaGalleryUpload";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TranslationReviewPanel, type TranslationReviewFields } from "@/components/TranslationReviewDialog";
import { translateContent } from "@/lib/translate";
import { ArrowLeft, Loader2, Languages, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

const STEPS = [
  { id: 1, label: "Project Info", desc: "Details & content" },
  { id: 2, label: "Review",       desc: "Translate & confirm" },
] as const;

type Step = 1 | 2;

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done   = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} className="flex items-center gap-0">
            <div className={`flex items-center gap-2.5 px-4 py-2.5 border transition-colors ${
              active ? "border-[hsl(var(--kesari))] bg-[hsl(var(--kesari-light))]"
                     : done ? "border-border bg-muted/40"
                     : "border-border bg-transparent"
            }`}>
              <div className={`h-6 w-6 flex items-center justify-center text-xs font-black border ${
                active ? "border-[hsl(var(--kesari))] text-[hsl(var(--kesari))]"
                       : done ? "border-border text-muted-foreground bg-muted"
                       : "border-border text-muted-foreground"
              }`}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" /> : s.id}
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${active ? "text-[hsl(var(--kesari))]" : "text-muted-foreground"}`}>
                  {s.label}
                </p>
                <p className="text-[10px] text-muted-foreground hidden sm:block">{s.desc}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${done ? "bg-border" : "bg-border/50"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminProjectCreatePage() {
  const [, navigate]  = useLocation();
  const { toast }     = useToast();
  const create        = useCreateProject();
  const allProjects   = useProjects({});
  const featuredCount = (allProjects.data || []).filter((p) => p.project.isFeatured).length;

  const [step, setStep] = useState<Step>(1);

  // All fields in one step
  const [slug,           setSlug]           = useState("");
  const [projectDate,    setProjectDate]    = useState("");
  const [isFeatured,     setIsFeatured]     = useState(false);
  const [coverImagePath, setCoverImagePath] = useState<string | null>(null);
  const [youtubeUrl,     setYoutubeUrl]     = useState("");
  const [galleryImages,  setGalleryImages]  = useState<string[]>([]);
  const [title,          setTitle]          = useState("");
  const [summary,        setSummary]        = useState("");
  const [contentHtml,    setContentHtml]    = useState("");

  // Step 2
  const [translating,         setTranslating]         = useState(false);
  const [pendingTranslations, setPendingTranslations] = useState<TranslationReviewFields[]>([]);

  function validate() {
    if (!slug.trim())       { toast({ title: "Slug is required",         variant: "destructive" }); return false; }
    if (!projectDate)       { toast({ title: "Project date is required", variant: "destructive" }); return false; }
    if (!title.trim())      { toast({ title: "Title is required",        variant: "destructive" }); return false; }
    if (!contentHtml.trim()){ toast({ title: "Content is required",      variant: "destructive" }); return false; }
    return true;
  }

  async function handleTranslate() {
    if (!validate()) return;
    setTranslating(true);
    try {
      let results: Record<string, any>;
      try {
        results = await translateContent(
          { title: title.trim(), summary: summary.trim(), contentHtml },
          "en", ["hi", "mr"]
        );
      } catch (transErr) {
        // Translation failed — still allow review with English pre-filled
        toast({ title: "Auto-translate failed", description: (transErr as Error).message + " — you can fill Hindi & Marathi manually.", variant: "destructive" });
        results = {
          en: { title: title.trim(), summary: summary.trim(), contentHtml },
          hi: { title: "", summary: "", contentHtml: "" },
          mr: { title: "", summary: "", contentHtml: "" },
        };
      }
      setPendingTranslations((["en", "hi", "mr"] as const).map((l) => ({
        language: l,
        status: "published" as const,
        title:       results[l]?.title       ?? "",
        summary:     results[l]?.summary     || null,
        contentHtml: results[l]?.contentHtml ?? "",
      })));
      setStep(2);
    } finally {
      setTranslating(false);
    }
  }

  async function handleConfirmCreate(allTranslations: Record<"en" | "hi" | "mr", TranslationReviewFields>) {
    try {
      await create.mutateAsync({
        slug: slug.trim(),
        isFeatured,
        coverImagePath,
        galleryImages: galleryImages.length ? galleryImages : undefined,
        projectDate: projectDate || null,
        youtubeUrl: youtubeUrl.trim() || null,
        translations: (["en", "hi", "mr"] as const).map((l) => ({
          language: l,
          status:      allTranslations[l].status ?? "published",
          title:       allTranslations[l].title,
          summary:     allTranslations[l].summary ?? null,
          contentHtml: allTranslations[l].contentHtml,
        })),
      });
      toast({ title: "Project created successfully" });
      navigate("/admin/projects");
    } catch (e) {
      const err = e as Error;
      if (isUnauthorizedError(err)) { window.location.href = "/admin/login"; return; }
      throw err;
    }
  }

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp">

          {/* Page header */}
          <div className="flex items-center gap-3 mb-1 max-w-3xl">
            <button
              onClick={() => navigate("/admin/projects")}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Projects
            </button>
          </div>
          <div className="mb-6 max-w-3xl">
            <p className="text-xs font-bold text-[hsl(var(--kesari))] uppercase tracking-wider mb-1">New Project</p>
            <h1 className="text-2xl font-bold">Create Project</h1>
          </div>

          <div className="max-w-3xl">
            <StepBar current={step} />
          </div>

          {/* ══ STEP 1 — Project Info (Details + Content merged) ══ */}
          {step === 1 && (
            <div className="border border-border max-w-3xl">

              {/* ── Section: Details ── */}
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <div className="w-1 h-4 bg-[hsl(var(--kesari))]" />
                <p className="text-sm font-bold">Details</p>
              </div>
              <div className="p-6 space-y-5 border-b border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Slug" required hint="URL-friendly, e.g. rural-health-2026">
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      placeholder="rural-health-2026"
                    />
                  </Field>
                  <Field label="Project Date" required>
                    <Input type="date" value={projectDate} onChange={(e) => setProjectDate(e.target.value)} />
                  </Field>
                </div>

                <Field label="YouTube URL" hint="Optional — embeds a video on the project page">
                  <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </Field>

                <div
                  className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                    isFeatured ? "border-[hsl(var(--kesari))] bg-[hsl(var(--kesari-light))]" : "border-border hover:border-foreground/30"
                  } ${featuredCount >= 4 && !isFeatured ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => { if (featuredCount >= 4 && !isFeatured) return; setIsFeatured((v) => !v); }}
                >
                  <div>
                    <p className="text-sm font-semibold">Feature on Home Page</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {featuredCount >= 4 && !isFeatured ? "Limit reached — unfeature another project first" : `${featuredCount}/4 slots used`}
                    </p>
                  </div>
                  <Checkbox
                    checked={isFeatured}
                    disabled={featuredCount >= 4 && !isFeatured}
                    onCheckedChange={(v) => setIsFeatured(Boolean(v))}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {featuredCount >= 4 && !isFeatured && (
                  <div className="flex items-start gap-3 border border-border p-4 bg-muted/20">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(var(--kesari))]" />
                    <p className="text-xs text-muted-foreground">Featured limit reached (4/4). Unfeature an existing project to feature this one.</p>
                  </div>
                )}

                <div className="border-t border-border pt-5">
                  <CoverImageField value={coverImagePath} onChange={setCoverImagePath} label="Cover Image" />
                </div>

                <div className="border-t border-border pt-5">
                  <MediaGalleryUpload value={galleryImages} onChange={setGalleryImages} label="Gallery Media" />
                </div>
              </div>

              {/* ── Section: Content ── */}
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <div className="w-1 h-4 bg-[hsl(var(--kesari))]" />
                <p className="text-sm font-bold">Content</p>
                <span className="text-xs text-muted-foreground ml-1">— English only, other languages auto-translated next</span>
              </div>
              <div className="p-6 space-y-5">
                <Field label="Title" required>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" />
                </Field>

                <Field label="Summary" hint="One-line description shown on cards and listings">
                  <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Brief one-line description" />
                </Field>

                <Field label="Content" required hint="Supports rich text, images and videos">
                  <RichTextEditor value={contentHtml} onChange={setContentHtml} placeholder="Write your project content here..." />
                </Field>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Fill all required fields, then translate
                </div>
                <button
                  onClick={() => void handleTranslate()}
                  disabled={translating}
                  className="h-9 px-6 text-xs font-bold uppercase tracking-wider bg-[hsl(var(--kesari))] text-white hover:bg-[hsl(var(--kesari-hover))] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {translating
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Translating…</>
                    : <><Languages className="h-3.5 w-3.5" />Translate & Review</>}
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 2 — Review inline ══ */}
          {step === 2 && (
            <TranslationReviewPanel
              translations={pendingTranslations}
              mode="project"
              onBack={() => setStep(1)}
              onConfirmCreate={handleConfirmCreate}
            />
          )}

        </div>
      </AdminShell>
    </AdminGuard>
  );
}
