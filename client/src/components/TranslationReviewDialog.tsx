import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Loader2, CheckCircle2, ArrowLeft, Languages, Save, Sparkles, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Lang = "en" | "hi" | "mr";

const LANG_META: Record<Lang, { short: string; native: string; flag: string; color: string }> = {
  en: { short: "EN", native: "English",  flag: "🇬🇧", color: "hsl(221 83% 53%)" },
  hi: { short: "HI", native: "हिन्दी",   flag: "🇮🇳", color: "hsl(25 95% 53%)" },
  mr: { short: "MR", native: "मराठी",    flag: "🇮🇳", color: "hsl(142 71% 45%)" },
};

export type TranslationReviewFields = {
  language: Lang;
  status?: "draft" | "published";
  title: string;
  summary?: string | null;
  contentHtml: string;
  location?: string | null;
  introduction?: string | null;
  requirements?: string | null;
};

// ─────────────────────────────────────────────────────────────
// Row-wise field layout helpers
// ─────────────────────────────────────────────────────────────

function LangBadge({ lang, dirty, saved }: { lang: Lang; dirty: boolean; saved: boolean }) {
  const meta = LANG_META[lang];
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-base leading-none">{meta.flag}</span>
      <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: meta.color }}>
        {meta.short}
      </span>
      <span className="text-xs font-semibold text-foreground">{meta.native}</span>
      {saved && !dirty && (
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 dark:bg-green-950/30 dark:border-green-800">
          <CheckCircle2 className="h-2.5 w-2.5" /> Saved
        </span>
      )}
      {dirty && (
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 dark:bg-orange-950/30 dark:border-orange-800">
          Edited
        </span>
      )}
      {lang !== "en" && !dirty && !saved && (
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground border border-border px-1.5 py-0.5">
          <Sparkles className="h-2.5 w-2.5" /> AI
        </span>
      )}
    </div>
  );
}

function FieldRow({
  label,
  required,
  langs,
  fields,
  dirty,
  saved,
  renderInput,
}: {
  label: string;
  required?: boolean;
  langs: Lang[];
  fields: Record<Lang, TranslationReviewFields>;
  dirty: Set<Lang>;
  saved: Set<Lang>;
  renderInput: (lang: Lang, fields: TranslationReviewFields) => React.ReactNode;
}) {
  return (
    <div className="border border-border bg-card">
      {/* Field label bar */}
      <div className="px-4 py-2 border-b border-border bg-muted/40 flex items-center gap-2">
        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {required && <span className="text-red-500 text-xs">*</span>}
        <Globe className="h-3 w-3 text-muted-foreground/50 ml-auto" />
      </div>
      {/* 3 columns — one per language */}
      <div className="grid grid-cols-3 divide-x divide-border">
        {langs.map((lang) => (
          <div key={lang} className="p-4">
            <LangBadge lang={lang} dirty={dirty.has(lang)} saved={saved.has(lang)} />
            {renderInput(lang, fields[lang])}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INLINE PANEL — used inside create pages (no overlay)
// ─────────────────────────────────────────────────────────────

type PanelProps = {
  translations: TranslationReviewFields[];
  mode: "project" | "event";
  onBack: () => void;
  onConfirmCreate: (translations: Record<Lang, TranslationReviewFields>) => Promise<void>;
};

export function TranslationReviewPanel({ translations, mode, onBack, onConfirmCreate }: PanelProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Set<Lang>>(new Set());

  const [fields, setFields] = useState<Record<Lang, TranslationReviewFields>>(() => {
    const d: Record<Lang, TranslationReviewFields> = {
      en: { language: "en", title: "", summary: "", contentHtml: "" },
      hi: { language: "hi", title: "", summary: "", contentHtml: "" },
      mr: { language: "mr", title: "", summary: "", contentHtml: "" },
    };
    for (const t of translations) d[t.language] = { ...t };
    return d;
  });

  function update(lang: Lang, patch: Partial<TranslationReviewFields>) {
    setFields((prev) => ({ ...prev, [lang]: { ...prev[lang], ...patch } }));
    setDirty((prev) => new Set(prev).add(lang));
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirmCreate(fields);
    } catch (e) {
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const langs: Lang[] = ["en", "hi", "mr"];
  const saved = new Set<Lang>();

  return (
    <div className="border border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-[hsl(var(--kesari))]" />
          <div>
            <p className="text-sm font-bold">Review Translations</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hindi & Marathi were auto-translated — review and edit before confirming
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          {langs.map((l) => (
            <span
              key={l}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border ${
                dirty.has(l)
                  ? "border-[hsl(var(--kesari-border))] text-[hsl(var(--kesari))] bg-[hsl(var(--kesari-light))]"
                  : "border-border text-muted-foreground"
              }`}
            >
              {dirty.has(l) && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--kesari))]" />}
              {LANG_META[l].short}
            </span>
          ))}
        </div>
      </div>

      {/* Row-wise fields */}
      <div className="p-4 space-y-3">
        <FieldRow
          label="Title" required
          langs={langs} fields={fields} dirty={dirty} saved={saved}
          renderInput={(lang, f) => (
            <Input
              value={f.title}
              onChange={(e) => update(lang, { title: e.target.value })}
              placeholder="Title"
              className="text-sm"
            />
          )}
        />
        <FieldRow
          label="Summary"
          langs={langs} fields={fields} dirty={dirty} saved={saved}
          renderInput={(lang, f) => (
            <Input
              value={f.summary ?? ""}
              onChange={(e) => update(lang, { summary: e.target.value || null })}
              placeholder="One-line summary"
              className="text-sm"
            />
          )}
        />
        {mode === "event" && (
          <>
            <FieldRow
              label="Location"
              langs={langs} fields={fields} dirty={dirty} saved={saved}
              renderInput={(lang, f) => (
                <Input
                  value={f.location ?? ""}
                  onChange={(e) => update(lang, { location: e.target.value || null })}
                  placeholder="Location"
                  className="text-sm"
                />
              )}
            />
            <FieldRow
              label="Introduction"
              langs={langs} fields={fields} dirty={dirty} saved={saved}
              renderInput={(lang, f) => (
                <Textarea
                  value={f.introduction ?? ""}
                  onChange={(e) => update(lang, { introduction: e.target.value || null })}
                  rows={3}
                  placeholder="Introduction"
                  className="resize-none text-sm"
                />
              )}
            />
            <FieldRow
              label="Requirements"
              langs={langs} fields={fields} dirty={dirty} saved={saved}
              renderInput={(lang, f) => (
                <Textarea
                  value={f.requirements ?? ""}
                  onChange={(e) => update(lang, { requirements: e.target.value || null })}
                  rows={2}
                  placeholder="Requirements"
                  className="resize-none text-sm"
                />
              )}
            />
          </>
        )}
        {/* Content — full width row per language for rich editor */}
        <div className="border border-border bg-card">
          <div className="px-4 py-2 border-b border-border bg-muted/40 flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Content</span>
            <Globe className="h-3 w-3 text-muted-foreground/50 ml-auto" />
          </div>
          <div className="divide-y divide-border">
            {langs.map((lang) => (
              <div key={lang} className="p-4">
                <LangBadge lang={lang} dirty={dirty.has(lang)} saved={saved.has(lang)} />
                <RichTextEditor
                  value={fields[lang].contentHtml}
                  onChange={(val) => update(lang, { contentHtml: val })}
                  placeholder="Write content here..."
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          disabled={saving}
          className="h-9 px-5 text-xs font-bold uppercase tracking-wider border border-border bg-transparent text-foreground hover:border-foreground transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <button
          onClick={() => void handleConfirm()}
          disabled={saving}
          className="h-9 px-6 text-xs font-bold uppercase tracking-wider bg-[hsl(var(--kesari))] text-white hover:bg-[hsl(var(--kesari-hover))] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Creating…</>
            : <><CheckCircle2 className="h-3.5 w-3.5" />Confirm & Create</>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FULL-SCREEN DIALOG — used in edit pages
// ─────────────────────────────────────────────────────────────

type DialogProps = {
  open: boolean;
  onClose: () => void;
  translations: TranslationReviewFields[];
  mode: "project" | "event";
} & (
  | { variant: "edit";   onSave: (lang: Lang, fields: TranslationReviewFields) => Promise<void> }
  | { variant: "create"; onConfirmCreate: (translations: Record<Lang, TranslationReviewFields>) => Promise<void> }
);

export function TranslationReviewDialog({ open, onClose, translations, mode, ...rest }: DialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState<Lang | "all" | null>(null);
  const [savedSet, setSavedSet] = useState<Set<Lang>>(new Set());
  const [dirty, setDirty] = useState<Set<Lang>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll page to top when dialog opens so the fixed overlay isn't hidden behind scroll position
  useEffect(() => {
    if (open) {
      window.scrollTo({ top: 0 });
      scrollRef.current?.scrollTo({ top: 0 });
    }
  }, [open]);

  const [fields, setFields] = useState<Record<Lang, TranslationReviewFields>>(() => {
    const d: Record<Lang, TranslationReviewFields> = {
      en: { language: "en", title: "", summary: "", contentHtml: "" },
      hi: { language: "hi", title: "", summary: "", contentHtml: "" },
      mr: { language: "mr", title: "", summary: "", contentHtml: "" },
    };
    for (const t of translations) d[t.language] = { ...t };
    return d;
  });

  function update(lang: Lang, patch: Partial<TranslationReviewFields>) {
    setFields((prev) => ({ ...prev, [lang]: { ...prev[lang], ...patch } }));
    setDirty((prev) => new Set(prev).add(lang));
  }

  async function handleSaveOne(lang: Lang) {
    if (rest.variant !== "edit") return;
    setSaving(lang);
    try {
      await rest.onSave(lang, fields[lang]);
      setSavedSet((prev) => new Set(prev).add(lang));
      setDirty((prev) => { const n = new Set(prev); n.delete(lang); return n; });
      toast({ title: `${LANG_META[lang].native} saved` });
    } catch (e) {
      toast({ title: "Save failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  async function handleConfirm() {
    setSaving("all");
    try {
      if (rest.variant === "edit") {
        await Promise.all((["en", "hi", "mr"] as Lang[]).map((l) => rest.onSave(l, fields[l])));
        toast({ title: "All translations saved" });
        onClose();
      } else {
        await rest.onConfirmCreate(fields);
        onClose();
      }
    } catch (e) {
      toast({ title: "Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  if (!open) return null;

  const langs: Lang[] = ["en", "hi", "mr"];
  const isBusy = saving !== null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="shrink-0 border-b border-border" style={{ background: "#000" }}>
        <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-12 h-12 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              disabled={isBusy}
              className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-4 w-px bg-white/20" />
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-[hsl(var(--kesari))]" />
              <span className="text-sm font-semibold text-white">Review Translations</span>
              <span className="hidden sm:inline text-xs text-white/40">— {mode === "project" ? "Project" : "Event"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language status pills */}
            <div className="hidden md:flex items-center gap-1.5">
              {langs.map((l) => (
                <span
                  key={l}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                    savedSet.has(l) && !dirty.has(l)
                      ? "border-green-500/50 text-green-400 bg-green-500/10"
                      : dirty.has(l)
                      ? "border-orange-400/50 text-orange-400 bg-orange-400/10"
                      : "border-white/20 text-white/50"
                  }`}
                >
                  {savedSet.has(l) && !dirty.has(l) && <CheckCircle2 className="h-2.5 w-2.5" />}
                  {LANG_META[l].flag} {LANG_META[l].short}
                </span>
              ))}
            </div>
            <button
              onClick={onClose}
              disabled={isBusy}
              className="h-8 px-4 text-xs font-bold uppercase tracking-wider border border-white/25 text-white/70 hover:text-white hover:border-white/60 transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleConfirm()}
              disabled={isBusy}
              className="h-8 px-5 text-xs font-bold uppercase tracking-wider bg-[hsl(var(--kesari))] text-white hover:bg-[hsl(var(--kesari-hover))] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving === "all"
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                : rest.variant === "create"
                ? <><CheckCircle2 className="h-3.5 w-3.5" />Confirm & Create</>
                : <><Save className="h-3.5 w-3.5" />Save All</>}
            </button>
          </div>
        </div>
      </div>

      {/* Info strip */}
      <div className="shrink-0 border-b border-border bg-muted/20 px-6 lg:px-12 py-2.5 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {rest.variant === "create"
            ? "Hindi and Marathi were auto-translated. Each row shows all 3 languages — review and edit side by side."
            : "Edit any language independently. Each row shows all 3 languages side by side. Save individually or all at once."}
        </p>
        {rest.variant === "edit" && (
          <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">
            {savedSet.size}/3 saved
          </span>
        )}
      </div>

      {/* Body — row-wise layout on desktop, tabs on mobile */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Mobile: tab-based single column */}
        <div className="lg:hidden">
          <Tabs defaultValue="en" className="flex flex-col">
            <TabsList className="grid grid-cols-3 rounded-none border-b border-border bg-background h-10 p-0 gap-0 sticky top-0 z-10">
              {langs.map((l) => (
                <TabsTrigger
                  key={l}
                  value={l}
                  className="rounded-none h-full text-xs font-bold uppercase tracking-wider border-b-2 border-transparent data-[state=active]:border-[hsl(var(--kesari))] data-[state=active]:text-foreground text-muted-foreground gap-1.5"
                >
                  {LANG_META[l].flag} {LANG_META[l].short}
                  {dirty.has(l) && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                  {savedSet.has(l) && !dirty.has(l) && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                </TabsTrigger>
              ))}
            </TabsList>
            {langs.map((l) => (
              <TabsContent key={l} value={l} className="mt-0 p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Title <span className="text-red-500">*</span></label>
                  <Input value={fields[l].title} onChange={(e) => update(l, { title: e.target.value })} placeholder="Title" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Summary</label>
                  <Input value={fields[l].summary ?? ""} onChange={(e) => update(l, { summary: e.target.value || null })} placeholder="One-line summary" />
                </div>
                {mode === "event" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Location</label>
                      <Input value={fields[l].location ?? ""} onChange={(e) => update(l, { location: e.target.value || null })} placeholder="Location" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Introduction</label>
                      <Textarea value={fields[l].introduction ?? ""} onChange={(e) => update(l, { introduction: e.target.value || null })} rows={3} placeholder="Introduction" className="resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Requirements</label>
                      <Textarea value={fields[l].requirements ?? ""} onChange={(e) => update(l, { requirements: e.target.value || null })} rows={2} placeholder="Requirements" className="resize-none" />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Content</label>
                  <RichTextEditor value={fields[l].contentHtml} onChange={(val) => update(l, { contentHtml: val })} placeholder="Write content here..." />
                </div>
                {rest.variant === "edit" && (
                  <button onClick={() => void handleSaveOne(l)} disabled={isBusy} className="w-full h-9 text-xs font-bold uppercase tracking-wider border border-border bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving === l ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</> : savedSet.has(l) && !dirty.has(l) ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Saved</> : <><Save className="h-3.5 w-3.5" />Save {LANG_META[l].native}</>}
                  </button>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Desktop: row-wise 3-column layout */}
        <div className="hidden lg:block max-w-[1600px] mx-auto px-4 lg:px-8 py-4 space-y-3">

          {/* Column headers — sticky (hidden on mobile, tabs used instead) */}
          <div className="hidden lg:grid grid-cols-3 gap-0 border border-border bg-muted/50 divide-x divide-border sticky top-0 z-10">
            {langs.map((lang) => (
              <div key={lang} className="px-4 py-3 flex items-center gap-2.5">
                <span className="text-lg leading-none">{LANG_META[lang].flag}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-black uppercase tracking-widest"
                      style={{ color: LANG_META[lang].color }}
                    >
                      {LANG_META[lang].short}
                    </span>
                    <span className="text-sm font-bold text-foreground">{LANG_META[lang].native}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {lang === "en" ? "Source — original input" : "Auto-translated · review & edit"}
                  </p>
                </div>
                {rest.variant === "edit" && (
                  <button
                    onClick={() => void handleSaveOne(lang)}
                    disabled={isBusy}
                    className="ml-auto h-7 px-3 text-[10px] font-bold uppercase tracking-wider border border-border bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {saving === lang
                      ? <><Loader2 className="h-3 w-3 animate-spin" />Saving…</>
                      : savedSet.has(lang) && !dirty.has(lang)
                      ? <><CheckCircle2 className="h-3 w-3 text-green-500" />Saved</>
                      : <><Save className="h-3 w-3" />Save</>}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Title row */}
          <div className="border border-border bg-card">
            <div className="px-4 py-2 border-b border-border bg-muted/40">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                Title <span className="text-red-500">*</span>
              </span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border">
              {langs.map((lang) => (
                <div key={lang} className="p-3">
                  <Input
                    value={fields[lang].title}
                    onChange={(e) => update(lang, { title: e.target.value })}
                    placeholder="Title"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary row */}
          <div className="border border-border bg-card">
            <div className="px-4 py-2 border-b border-border bg-muted/40">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Summary</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border">
              {langs.map((lang) => (
                <div key={lang} className="p-3">
                  <Input
                    value={fields[lang].summary ?? ""}
                    onChange={(e) => update(lang, { summary: e.target.value || null })}
                    placeholder="One-line summary"
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Event-only fields */}
          {mode === "event" && (
            <>
              <div className="border border-border bg-card">
                <div className="px-4 py-2 border-b border-border bg-muted/40">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Location</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border">
                  {langs.map((lang) => (
                    <div key={lang} className="p-3">
                      <Input
                        value={fields[lang].location ?? ""}
                        onChange={(e) => update(lang, { location: e.target.value || null })}
                        placeholder="Location"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-border bg-card">
                <div className="px-4 py-2 border-b border-border bg-muted/40">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Introduction</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border">
                  {langs.map((lang) => (
                    <div key={lang} className="p-3">
                      <Textarea
                        value={fields[lang].introduction ?? ""}
                        onChange={(e) => update(lang, { introduction: e.target.value || null })}
                        rows={3}
                        placeholder="Introduction"
                        className="resize-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-border bg-card">
                <div className="px-4 py-2 border-b border-border bg-muted/40">
                  <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Requirements</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border">
                  {langs.map((lang) => (
                    <div key={lang} className="p-3">
                      <Textarea
                        value={fields[lang].requirements ?? ""}
                        onChange={(e) => update(lang, { requirements: e.target.value || null })}
                        rows={2}
                        placeholder="Requirements"
                        className="resize-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Content — stacked per language (rich editor needs full width) */}
          <div className="border border-border bg-card">
            <div className="px-4 py-2 border-b border-border bg-muted/40">
              <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Content</span>
            </div>
            <div className="divide-y divide-border">
              {langs.map((lang) => (
                <div key={lang} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base leading-none">{LANG_META[lang].flag}</span>
                    <span
                      className="text-[11px] font-black uppercase tracking-widest"
                      style={{ color: LANG_META[lang].color }}
                    >
                      {LANG_META[lang].short}
                    </span>
                    <span className="text-xs font-semibold text-foreground">{LANG_META[lang].native}</span>
                    {dirty.has(lang) && (
                      <span className="ml-2 text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 dark:bg-orange-950/30 dark:border-orange-800">
                        Edited
                      </span>
                    )}
                    {savedSet.has(lang) && !dirty.has(lang) && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 dark:bg-green-950/30 dark:border-green-800">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Saved
                      </span>
                    )}
                  </div>
                  <RichTextEditor
                    value={fields[lang].contentHtml}
                    onChange={(val) => update(lang, { contentHtml: val })}
                    placeholder="Write content here..."
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
