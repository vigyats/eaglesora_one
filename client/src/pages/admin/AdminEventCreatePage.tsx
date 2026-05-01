import { useState } from "react";
import { useLocation } from "wouter";
import { AdminShell } from "@/components/Shell";
import { AdminGuard } from "@/pages/admin/AdminGuard";
import { useCreateEvent } from "@/hooks/use-events";
import { useToast } from "@/hooks/use-toast";
import { CoverImageField } from "@/components/CoverImageField";
import { MediaGalleryUpload } from "@/components/MediaGalleryUpload";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TranslationReviewPanel, type TranslationReviewFields } from "@/components/TranslationReviewDialog";
import { translateContent } from "@/lib/translate";
import { ArrowLeft, Loader2, Languages, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

const STEPS = [
  { id: 1, label: "Event Info", desc: "Details & content" },
  { id: 2, label: "Review",     desc: "Translate & confirm" },
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
            {i < STEPS.length - 1 && <div className={`h-px w-8 ${done ? "bg-border" : "bg-border/50"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminEventCreatePage() {
  const [, navigate] = useLocation();
  const { toast }    = useToast();
  const create       = useCreateEvent();

  const [step, setStep] = useState<Step>(1);

  // Details
  const [slug,                  setSlug]                  = useState("");
  const [startDate,             setStartDate]             = useState("");
  const [endDate,               setEndDate]               = useState("");
  const [registrationStartDate, setRegistrationStartDate] = useState("");
  const [registrationEndDate,   setRegistrationEndDate]   = useState("");
  const [cover,                 setCover]                 = useState<string | null>(null);
  const [flyer,                 setFlyer]                 = useState<string | null>(null);
  const [eventPrice,            setEventPrice]            = useState("");
  const [participationType,     setParticipationType]     = useState("");
  const [registrationFormUrl,   setRegistrationFormUrl]   = useState("");
  const [galleryImages,         setGalleryImages]         = useState<string[]>([]);

  // Content
  const [title,        setTitle]        = useState("");
  const [location,     setLocation]     = useState("");
  const [summary,      setSummary]      = useState("");
  const [introduction, setIntroduction] = useState("");
  const [requirements, setRequirements] = useState("");
  const [contentHtml,  setContentHtml]  = useState("");

  // Step 2
  const [translating,         setTranslating]         = useState(false);
  const [pendingTranslations, setPendingTranslations] = useState<TranslationReviewFields[]>([]);

  function validate() {
    if (!slug.trim())  { toast({ title: "Slug is required",             variant: "destructive" }); return false; }
    if (!startDate)    { toast({ title: "Event start date is required", variant: "destructive" }); return false; }
    if (!title.trim()) { toast({ title: "Title is required",            variant: "destructive" }); return false; }
    return true;
  }

  async function handleTranslate() {
    if (!validate()) return;
    setTranslating(true);
    try {
      const results = await translateContent(
        { title: title.trim(), summary: summary.trim(), contentHtml: contentHtml || "<p></p>", location: location.trim(), introduction: introduction.trim(), requirements: requirements.trim() },
        "en", ["hi", "mr"]
      );
      setPendingTranslations((["en", "hi", "mr"] as const).map((l) => ({
        language: l,
        status: "published" as const,
        title:        results[l]?.title        ?? "",
        summary:      results[l]?.summary      || null,
        contentHtml:  results[l]?.contentHtml  ?? "",
        location:     results[l]?.location     || null,
        introduction: results[l]?.introduction || null,
        requirements: results[l]?.requirements || null,
      })));
      setStep(2);
    } catch {
      toast({ title: "Translation failed", description: "Could not auto-translate. Check API key.", variant: "destructive" });
    } finally {
      setTranslating(false);
    }
  }

  async function handleConfirmCreate(allTranslations: Record<"en" | "hi" | "mr", TranslationReviewFields>) {
    try {
      await create.mutateAsync({
        slug: slug.trim(),
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        registrationStartDate: registrationStartDate ? new Date(registrationStartDate).toISOString() : null,
        registrationEndDate:   registrationEndDate   ? new Date(registrationEndDate).toISOString()   : null,
        galleryImages: galleryImages.length ? galleryImages : undefined,
        coverImagePath: cover,
        flyerImagePath: flyer,
        registrationFormUrl: registrationFormUrl.trim() || null,
        eventPrice: eventPrice.trim() || null,
        participationType: participationType.trim() || null,
        translations: (["en", "hi", "mr"] as const).map((l) => ({
          language: l,
          status:       allTranslations[l].status ?? "published",
          title:        allTranslations[l].title,
          location:     allTranslations[l].location     ?? null,
          summary:      allTranslations[l].summary      ?? null,
          introduction: allTranslations[l].introduction ?? null,
          requirements: allTranslations[l].requirements ?? null,
          contentHtml:  allTranslations[l].contentHtml  || "<p></p>",
        })),
      });
      toast({ title: "Event created successfully" });
      navigate("/admin/events");
    } catch (e) {
      throw e;
    }
  }

  return (
    <AdminGuard>
      <AdminShell>
        <div className="animate-fadeUp">

          {/* Page header */}
          <div className="flex items-center gap-3 mb-1 max-w-3xl">
            <button
              onClick={() => navigate("/admin/events")}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Events
            </button>
          </div>
          <div className="mb-6 max-w-3xl">
            <p className="text-xs font-bold text-[hsl(var(--kesari))] uppercase tracking-wider mb-1">New Event</p>
            <h1 className="text-2xl font-bold">Create Event</h1>
          </div>

          <div className="max-w-3xl">
            <StepBar current={step} />
          </div>

          {/* ══ STEP 1 — Event Info ══ */}
          {step === 1 && (
            <div className="border border-border max-w-3xl">

              {/* Details section */}
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <div className="w-1 h-4 bg-[hsl(var(--kesari))]" />
                <p className="text-sm font-bold">Details</p>
              </div>
              <div className="p-6 space-y-5 border-b border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Slug" required hint="URL-friendly, e.g. annual-meet-2026">
                    <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="annual-meet-2026" />
                  </Field>
                  <Field label="Event Price (₹)" hint="Leave blank for free">
                    <Input value={eventPrice} onChange={(e) => setEventPrice(e.target.value)} placeholder="Free, 500, 1000" />
                  </Field>
                </div>

                <Field label="Participation Type">
                  <Input value={participationType} onChange={(e) => setParticipationType(e.target.value)} placeholder="Team, Individual, Both" />
                </Field>

                <Field label="Google Form URL" hint="Optional external registration form">
                  <Input value={registrationFormUrl} onChange={(e) => setRegistrationFormUrl(e.target.value)} placeholder="https://forms.google.com/..." />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Event Start" required>
                    <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </Field>
                  <Field label="Event End">
                    <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Registration Start">
                    <Input type="datetime-local" value={registrationStartDate} onChange={(e) => setRegistrationStartDate(e.target.value)} />
                  </Field>
                  <Field label="Registration End">
                    <Input type="datetime-local" value={registrationEndDate} onChange={(e) => setRegistrationEndDate(e.target.value)} />
                  </Field>
                </div>

                <div className="flex items-start gap-3 border border-border p-4 bg-muted/20">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Open registration automatically pins the event to the home page.</p>
                </div>

                <div className="border-t border-border pt-5 grid grid-cols-2 gap-4">
                  <CoverImageField value={flyer} onChange={setFlyer} label="Event Flyer" />
                  <CoverImageField value={cover} onChange={setCover} label="Cover Image (optional)" />
                </div>
                <div className="border-t border-border pt-5">
                  <MediaGalleryUpload value={galleryImages} onChange={setGalleryImages} label="Gallery Media" />
                </div>
              </div>

              {/* Content section */}
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <div className="w-1 h-4 bg-[hsl(var(--kesari))]" />
                <p className="text-sm font-bold">Content</p>
                <span className="text-xs text-muted-foreground ml-1">— English only, other languages auto-translated next</span>
              </div>
              <div className="p-6 space-y-5">
                <Field label="Title" required>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
                </Field>
                <Field label="Location">
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, venue, or region" />
                </Field>
                <Field label="Summary" hint="One-line description shown on cards">
                  <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Brief overview" />
                </Field>
                <Field label="Introduction">
                  <Textarea value={introduction} onChange={(e) => setIntroduction(e.target.value)} rows={3} placeholder="Detailed introduction" className="resize-none" />
                </Field>
                <Field label="Requirements">
                  <Textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={2} placeholder="Eligibility, prerequisites..." className="resize-none" />
                </Field>
                <Field label="Detailed Content" hint="Supports rich text, images and videos">
                  <RichTextEditor value={contentHtml} onChange={setContentHtml} placeholder="Agenda, highlights, schedule..." />
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
              mode="event"
              onBack={() => setStep(1)}
              onConfirmCreate={handleConfirmCreate}
            />
          )}

        </div>
      </AdminShell>
    </AdminGuard>
  );
}
