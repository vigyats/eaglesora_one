import { Shell } from "@/components/Shell";
import { useI18n } from "@/hooks/use-i18n";
import { useEvents } from "@/hooks/use-events";
import { useMemo } from "react";
import { Calendar, MapPin, ArrowRight, ImageOff, Star } from "lucide-react";
import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";

function pickTranslation<T extends { language: string; title: string; location?: string | null }>(
  translations: T[], lang: "en" | "hi" | "mr",
) {
  return translations.find((t) => t.language === lang) || translations.find((t) => t.language === "en") || translations[0] || null;
}

function fmtDate(d: string | null | undefined, lang: "en" | "hi" | "mr") {
  if (!d) return null;
  const locale = lang === "hi" ? "hi-IN-u-nu-deva" : lang === "mr" ? "mr-IN-u-nu-deva" : "en-IN";
  return new Date(d).toLocaleDateString(locale, { year: "numeric", month: "long", day: "2-digit" });
}

export default function EventsPage() {
  const { lang, t } = useI18n();
  usePageTitle("Events");
  const q = useEvents({ lang });

  const { upcoming, previous } = useMemo(() => {
    const now = Date.now();
    const list = (q.data || []).slice();
    const parts = list.reduce((acc, it) => {
      const end = it.event.endDate ? new Date(it.event.endDate as any).getTime() : 0;
      const start = it.event.startDate ? new Date(it.event.startDate as any).getTime() : 0;
      if ((end || start) >= now) acc.upcoming.push(it);
      else acc.previous.push(it);
      return acc;
    }, { upcoming: [] as any[], previous: [] as any[] });
    parts.upcoming.sort((a, b) => new Date(a.event.startDate as any).getTime() - new Date(b.event.startDate as any).getTime());
    parts.previous.sort((a, b) => new Date(b.event.startDate as any).getTime() - new Date(a.event.startDate as any).getTime());
    return parts;
  }, [q.data]);

  const EventCard = ({ it }: { it: any }) => {
    const tr = pickTranslation(it.translations as any[], lang);
    const start = fmtDate(it.event.startDate, lang);
    const end = fmtDate(it.event.endDate, lang);
    const dateStr = start && end ? `${start} — ${end}` : start || t.home.dateTBD;
    const img = it.event.flyerImagePath || it.event.coverImagePath;

    return (
      <Link href={`/events/${it.event.id}`}>
        <div className="group rounded-2xl overflow-hidden cursor-pointer bg-card border border-border hover:border-[hsl(var(--kesari))]/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5">
          {/* Thumbnail */}
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            {img ? (
              <img
                src={img}
                alt={tr?.title || ""}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                <ImageOff className="w-10 h-10 text-muted-foreground/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {it.event.isFeatured && (
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-[hsl(var(--kesari))] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                <Star className="w-3 h-3 fill-white" /> {t.labels.featured}
              </div>
            )}
            {it.event.eventPrice && (
              <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                ₹{it.event.eventPrice}
              </div>
            )}
            <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-md">
              <ArrowRight className="w-4 h-4 text-black" />
            </div>
          </div>
          {/* Info */}
          <div className="p-5">
            <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-[hsl(var(--kesari))] transition-colors duration-200">
              {tr?.title || "Untitled"}
            </h3>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>{dateStr}</span>
              </div>
              {(tr as any)?.location && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="line-clamp-1">{(tr as any).location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl overflow-hidden border border-border">
          <div className="aspect-[4/3] shimmer" />
          <div className="p-5 space-y-2">
            <div className="h-4 w-3/4 shimmer rounded" />
            <div className="h-3 w-1/2 shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Shell>
      <div>
        {/* Header */}
        <section className="pt-14 pb-12 px-6 sm:px-12 md:px-20 lg:px-32 border-b border-border animate-fadeUp notranslate">
          <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-4 whitespace-nowrap">{t.home.timeline}</p>
          <h1 className="text-foreground mb-4" style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)", fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em" }}>
            {t.labels.events}
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", maxWidth: "50ch", lineHeight: 1.7 }}>
            {t.home.upcomingGatherings}
          </p>
        </section>

        {/* Content */}
        <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-14 animate-fadeUp">
          {q.isLoading ? (
            <SkeletonGrid />
          ) : q.isError ? (
            <p className="text-muted-foreground text-sm">{t.home.couldNotLoadEvents}</p>
          ) : (q.data || []).length === 0 ? (
            <p className="text-muted-foreground">{t.empty.events}</p>
          ) : (
            <div className="space-y-14">
              {upcoming.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-8 notranslate">
                    <div className="w-6 h-[2px] bg-[hsl(var(--kesari))]" />
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{t.labels.upcoming}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcoming.map((it: any) => <EventCard key={it.event.id} it={it} />)}
                  </div>
                </div>
              )}

              {previous.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-8 notranslate">
                    <div className="w-6 h-[2px] bg-border" />
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{t.labels.previous}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {previous.map((it: any) => <EventCard key={it.event.id} it={it} />)}
                  </div>
                </div>
              )}

              {upcoming.length === 0 && previous.length === 0 && (
                <p className="text-sm text-muted-foreground">{t.home.noUpcoming}</p>
              )}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
