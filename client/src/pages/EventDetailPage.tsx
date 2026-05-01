import { Shell } from "@/components/Shell";
import { useI18n } from "@/hooks/use-i18n";
import { useEvent } from "@/hooks/use-events";
import { useParams, Link } from "wouter";
import { ArrowLeft, MapPin, CalendarDays, Send, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";

function pick<T extends { language: string; title: string; location?: string | null; contentHtml: string }>(
  translations: T[], lang: "en" | "hi" | "mr",
) {
  return translations.find((t) => t.language === lang) || translations.find((t) => t.language === "en") || translations[0] || null;
}

function dateRange(start?: string | null, end?: string | null, lang: "en" | "hi" | "mr" = "en") {
  const locale = lang === "hi" ? "hi-IN-u-nu-deva" : lang === "mr" ? "mr-IN-u-nu-deva" : "en-IN";
  const fmt = (d: Date) => d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "2-digit" });
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (s && e) return `${fmt(s)} — ${fmt(e)}`;
  if (s) return fmt(s);
  return "Date TBD";
}

export default function EventDetailPage() {
  const params = useParams() as { id?: string };
  const id = Number(params.id);
  const { lang, t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Invalidate event query when language changes to force refetch
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [api.events.get.path, id] });
  }, [lang, id, queryClient]);
  
  const q = useEvent(id, { lang });
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  const data = q.data as any;
  const tr = data?.translations ? pick(data.translations, lang) : null;
  const isFallback = tr !== null && tr.language !== lang;
  const formFields = data?.event?.registrationFormFields || [];

  // All media for this event — thumbnail excluded
  const mediaItems = useMemo<LightboxItem[]>(() => {
    if (!data?.event) return [];
    const thumbnail = data.event.flyerImagePath || data.event.coverImagePath;
    const gallery: string[] = (data.event.galleryImages as string[] | null) || [];
    const all = [data.event.coverImagePath, data.event.flyerImagePath, ...gallery]
      .filter((u): u is string => !!u && u !== thumbnail);
    return [...new Set(all)].map((url, i) => ({
      url,
      label: i === 0 && url === data.event.coverImagePath ? "Cover"
           : i === 0 && url === data.event.flyerImagePath ? "Flyer"
           : `Photo ${i + 1}`,
    }));
  }, [data]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Registration failed");
      setSubmitted(true);
      toast({ title: "Registered!", description: "You have been registered for this event." });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <div>
        {/* Back */}
        <div className="px-6 sm:px-12 md:px-20 lg:px-32 pt-8 pb-0">
          <Link href="/events" className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> {t.home.backToEvents}
          </Link>
        </div>

        {q.isLoading ? (
          <div className="px-6 sm:px-12 md:px-20 lg:px-32 py-14 space-y-4">
            <div className="h-8 w-2/3 shimmer" />
            <div className="h-4 w-1/3 shimmer" />
            <div className="h-64 shimmer mt-8" />
          </div>
        ) : q.isError || !data?.event ? (
          <div className="px-6 sm:px-12 md:px-20 lg:px-32 py-14">
            <p className="text-muted-foreground">{t.home.eventNotFound}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <section className="px-6 sm:px-12 md:px-20 lg:px-32 pt-12 pb-10 border-b border-border">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[hsl(var(--kesari))] mb-4">{t.home.eventLabel}</p>
              <h1 className="text-foreground mb-6" style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)", fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em" }}>
                {tr?.title || "Untitled"}
              </h1>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-[hsl(var(--kesari))]" />
                  {dateRange(data.event.startDate, data.event.endDate, lang)}
                </div>
                {(tr as any)?.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-[hsl(var(--kesari))]" />
                    {(tr as any).location}
                  </div>
                )}
                {data.event.eventPrice && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {data.event.eventPrice === "Free" ? "Free Entry" : `₹${data.event.eventPrice}`}
                  </div>
                )}
              </div>
            </section>

            {/* Body + Registration */}
            <div className="px-6 sm:px-12 md:px-20 lg:px-32 py-14 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-16">

              <div>
                <article
                  className={cn("prose prose-slate max-w-none",
                    "prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground",
                    "prose-p:text-foreground/80 prose-p:leading-[1.85]",
                    "prose-a:text-[hsl(var(--kesari))] prose-a:no-underline hover:prose-a:underline",
                    "prose-strong:text-foreground prose-strong:font-semibold",
                    "prose-blockquote:border-l-[hsl(var(--kesari))] prose-blockquote:text-muted-foreground"
                  )}
                  dangerouslySetInnerHTML={{ __html: tr?.contentHtml || "<p>No content available.</p>" }}
                />

                {/* Gallery */}
                {mediaItems.length > 0 && (
                  <div className="mt-14">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-6 h-[2px] bg-[hsl(var(--kesari))]" />
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Gallery</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {mediaItems.map((item, i) => (
                        <button key={i} onClick={() => setLbIndex(i)}
                          className="group relative aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none">
                          <img src={item.url} alt={item.label || `Photo ${i + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                          {item.label && (
                            <div className="absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-wider text-white/70 bg-black/40 px-1.5 py-0.5 rounded">
                              {item.label}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Registration form */}
              {formFields.length > 0 && (
                <aside>
                  <div className="border border-border p-6 sticky top-20">
                    <div className="w-6 h-[2px] bg-[hsl(var(--kesari))] mb-4" />
                    <h3 className="font-bold text-foreground mb-6 text-base">{t.home.registerEvent}</h3>

                    {submitted ? (
                      <div className="py-8 text-center">
                        <p className="font-semibold text-foreground mb-1">{t.home.registered}</p>
                        <p className="text-sm text-muted-foreground">{t.home.registeredDesc}</p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {formFields.map((field: any) => (
                          <div key={field.id}>
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                              {field.label}{field.required && <span className="text-[hsl(var(--kesari))] ml-1">*</span>}
                            </label>
                            {field.type === "textarea" ? (
                              <textarea required={field.required} value={formData[field.id] || ""}
                                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                className="w-full border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors resize-none h-24" />
                            ) : field.type === "select" ? (
                              <Select value={formData[field.id] || ""} onValueChange={(v) => setFormData({ ...formData, [field.id]: v })}>
                                <SelectTrigger className="rounded-none border-border">
                                  <SelectValue placeholder="Select…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((opt: string) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : field.type === "checkbox" ? (
                              <div className="flex items-center gap-2">
                                <input type="checkbox" required={field.required}
                                  checked={formData[field.id] || false}
                                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
                                  className="h-4 w-4 border-border" />
                                <span className="text-sm text-muted-foreground">{field.label}</span>
                              </div>
                            ) : (
                              <input type={field.type} required={field.required} value={formData[field.id] || ""}
                                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                className="w-full border border-border bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors" />
                            )}
                          </div>
                        ))}
                        <button type="submit" disabled={submitting}
                          className="w-full h-11 flex items-center justify-center gap-2 bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors disabled:opacity-50 mt-2">
                          <Send className="h-3.5 w-3.5" />
                          {submitting ? t.home.submitting : t.home.registerNow}
                        </button>
                      </form>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </>
        )}
      </div>

      {lbIndex !== null && (
        <Lightbox items={mediaItems} index={lbIndex} onClose={() => setLbIndex(null)} onNav={setLbIndex} />
      )}
    </Shell>
  );
}
