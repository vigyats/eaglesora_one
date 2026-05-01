import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Loader2, CheckCircle2, ArrowLeft, Languages, Save, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Lang = "en" | "hi" | "mr";

const LANG_META: Record<Lang, { short: string; native: string; flag: string }> = {
  en: { short: "EN", native: "English", flag: "🇬🇧" },
  hi: { short: "HI", native: "हिन्दी",  flag: "🇮🇳" },
  mr: { short: "MR", native: "मराठी",   flag: "🇮🇳" },
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
// Shared internals
// ─────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function LangCard({
  lang, fields, mode, dirty, saved, onChange,
}: {
  lang: Lang;
  fields: TranslationReviewFields;
  mode: "project" | "event";
  dirty: boolean;
  saved: boolean;
  onChange: (patch: Partial<TranslationReviewFields>) => void;
}) {
  const meta = LANG_META[lang];
  return (
    <div className="border border-border bg-card flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg">{meta.flag}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-[hsl(var(--kesari))]">{meta.short}</span>
              <span className="text-sm font-bold text-foreground">{meta.native}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {lang === "en" ? "Source — your original input" : "Auto-translated · review & edit"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {saved && !dirty && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 dark:bg-green-950/30 dark:border-green-800 whitespace-nowrap">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
          )}
          {dirty && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[hsl(var(--kesari))] bg-[hsl(var(--kesari-light))] border border-[hsl(var(--kesari-border))] px-2 py-0.5 whitespace-nowrap">
              Edited
            </span>
          )}
          {lang !== "en" && !dirty && !saved && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground border border-border px-2 py-0.5 whitespace-nowrap">
              <Sparkles className="h-3 w-3" /> AI
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        <Field label="Title" required>
          <Input value={fields.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Title" />
        </Field>
        <Field label="Summary">
          <Input value={fields.summary ?? ""} onChange={(e) => onChange({ summary: e.target.value || null })} placeholder="One-line summary" />
        </Field>
        {mode === "event" && (
          <>
            <Field label="Location">
              <Input value={fields.location ?? ""} onChange={(e) => onChange({ location: e.target.value || null })} placeholder="Location" />
            </Field>
            <Field label="Introduction">
              <Textarea value={fields.introduction ?? ""} onChange={(e) => onChange({ introduction: e.target.value || null })} rows={3} placeholder="Introduction" className="resize-none" />
            </Field>
            <Field label="Requirements">
              <Textarea value={fields.requirements ?? ""} onChange={(e) => onChange({ requirements: e.target.value || null })} rows={2} placeholder="Requirements" className="resize-none" />
            </Field>
          </>
        )}
        <Field label="Content">
          <RichTextEditor value={fields.contentHtml} onChange={(val) => onChange({ contentHtml: val })} placeholder="Write content here..." />
        </Field>
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
  const [activeLang, setActiveLang] = useState<Lang>("en");
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

  return (
    <div className="border border-border">
      {/* Section header — same style as Details / Content sections */}
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
            <span key={l} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border ${
              dirty.has(l)
                ? "border-[hsl(var(--kesari-border))] text-[hsl(var(--kesari))] bg-[hsl(var(--kesari-light))]"
                : "border-border text-muted-foreground"
            }`}>
              {dirty.has(l) && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--kesari))]" />}
              {LANG_META[l].short}
            </span>
          ))}
        </div>
      </div>

      {/* Desktop: 3 columns */}
      <div className="hidden lg:block">
        <div className="grid lg:grid-cols-3 divide-x divide-border max-w-full">
          {langs.map((l) => (
            <div key={l} className="min-w-0">
              <LangCard
                lang={l}
                fields={fields[l]}
                mode={mode}
                dirty={dirty.has(l)}
                saved={false}
                onChange={(patch) => update(l, patch)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: tabs */}
      <div className="lg:hidden">
        <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as Lang)}>
          <TabsList className="grid grid-cols-3 rounded-none border-b border-border bg-background h-10 p-0 gap-0 w-full">
            {langs.map((l) => (
              <TabsTrigger
                key={l}
                value={l}
                className="rounded-none h-full text-xs font-bold uppercase tracking-wider border-b-2 border-transparent data-[state=active]:border-[hsl(var(--kesari))] data-[state=active]:text-foreground text-muted-foreground gap-1.5"
              >
                {LANG_META[l].short}
                <span className="hidden sm:inline normal-case font-semibold tracking-normal">{LANG_META[l].native}</span>
                {dirty.has(l) && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--kesari))]" />}
              </TabsTrigger>
            ))}
          </TabsList>
          {langs.map((l) => (
            <TabsContent key={l} value={l} className="mt-0">
              <LangCard
                lang={l}
                fields={fields[l]}
                mode={mode}
                dirty={dirty.has(l)}
                saved={false}
                onChange={(patch) => update(l, patch)}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Footer — same style as other step footers */}
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
  const [activeLang, setActiveLang] = useState<Lang>("en");
  const [saving, setSaving] = useState<Lang | "all" | null>(null);
  const [saved, setSaved] = useState<Set<Lang>>(new Set());
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

  async function handleSaveOne(lang: Lang) {
    if (rest.variant !== "edit") return;
    setSaving(lang);
    try {
      await rest.onSave(lang, fields[lang]);
      setSaved((prev) => new Set(prev).add(lang));
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
      {/* Black top bar */}
      <div className="shrink-0 border-b border-border" style={{ background: "#000" }}>
        <div className="w-full max-w-[1500px] mx-auto px-6 lg:px-12 h-12 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={onClose} disabled={isBusy} className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors disabled:opacity-40">
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
            <div className="hidden md:flex items-center gap-1.5">
              {langs.map((l) => (
                <span key={l} className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                  saved.has(l) && !dirty.has(l) ? "border-green-500/50 text-green-400 bg-green-500/10"
                  : dirty.has(l) ? "border-[hsl(var(--kesari))]/50 text-[hsl(var(--kesari))] bg-[hsl(var(--kesari))]/10"
                  : "border-white/20 text-white/50"
                }`}>
                  {saved.has(l) && !dirty.has(l) && <CheckCircle2 className="h-2.5 w-2.5" />}
                  {LANG_META[l].short}
                </span>
              ))}
            </div>
            <button onClick={onClose} disabled={isBusy} className="h-8 px-4 text-xs font-bold uppercase tracking-wider border border-white/25 text-white/70 hover:text-white hover:border-white/60 transition-all disabled:opacity-40">
              Cancel
            </button>
            <button onClick={() => void handleConfirm()} disabled={isBusy} className="h-8 px-5 text-xs font-bold uppercase tracking-wider bg-[hsl(var(--kesari))] text-white hover:bg-[hsl(var(--kesari-hover))] transition-all disabled:opacity-50 flex items-center gap-2">
              {saving === "all" ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                : rest.variant === "create" ? <><CheckCircle2 className="h-3.5 w-3.5" />Confirm & Create</>
                : <><Save className="h-3.5 w-3.5" />Save All</>}
            </button>
          </div>
        </div>
      </div>

      {/* Info strip */}
      <div className="shrink-0 border-b border-border bg-muted/20 px-6 lg:px-12 py-3 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {rest.variant === "create"
            ? "Hindi and Marathi were auto-translated. Review each language carefully before confirming."
            : "Edit any language independently. Save individually or all at once."}
        </p>
        {rest.variant === "edit" && <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">{saved.size}/3 saved</span>}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <div className="hidden lg:grid h-full divide-x divide-border" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {langs.map((l) => (
            <div key={l} className="overflow-y-auto flex flex-col min-w-0">
              <LangCard lang={l} fields={fields[l]} mode={mode} dirty={dirty.has(l)} saved={saved.has(l)} onChange={(patch) => update(l, patch)} />
              {rest.variant === "edit" && (
                <div className="shrink-0 p-4 border-t border-border bg-muted/20">
                  <button onClick={() => void handleSaveOne(l)} disabled={isBusy} className="w-full h-9 text-xs font-bold uppercase tracking-wider border border-border bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving === l ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                      : saved.has(l) && !dirty.has(l) ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Saved</>
                      : <><Save className="h-3.5 w-3.5" />Save {LANG_META[l].native}</>}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="lg:hidden h-full flex flex-col">
          <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as Lang)} className="flex flex-col h-full">
            <TabsList className="shrink-0 grid grid-cols-3 rounded-none border-b border-border bg-background h-10 p-0 gap-0">
              {langs.map((l) => (
                <TabsTrigger key={l} value={l} className="rounded-none h-full text-xs font-bold uppercase tracking-wider border-b-2 border-transparent data-[state=active]:border-[hsl(var(--kesari))] data-[state=active]:text-foreground text-muted-foreground gap-1.5">
                  {LANG_META[l].short}
                  <span className="hidden sm:inline normal-case font-semibold tracking-normal">{LANG_META[l].native}</span>
                  {saved.has(l) && !dirty.has(l) && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  {dirty.has(l) && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--kesari))]" />}
                </TabsTrigger>
              ))}
            </TabsList>
            {langs.map((l) => (
              <TabsContent key={l} value={l} className="flex-1 overflow-y-auto mt-0 flex flex-col">
                <LangCard lang={l} fields={fields[l]} mode={mode} dirty={dirty.has(l)} saved={saved.has(l)} onChange={(patch) => update(l, patch)} />
                {rest.variant === "edit" && (
                  <div className="shrink-0 p-4 border-t border-border bg-muted/20">
                    <button onClick={() => void handleSaveOne(l)} disabled={isBusy} className="w-full h-9 text-xs font-bold uppercase tracking-wider border border-border bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {saving === l ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                        : saved.has(l) && !dirty.has(l) ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />Saved</>
                        : <><Save className="h-3.5 w-3.5" />Save {LANG_META[l].native}</>}
                    </button>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
