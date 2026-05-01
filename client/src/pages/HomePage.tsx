import { useI18n } from "@/hooks/use-i18n";
import { Link } from "wouter";
import { ArrowRight, ArrowLeft, Images } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { TopNavOnly } from "@/components/Shell";
import { Footer } from "@/components/Footer";
import { useProjects } from "@/hooks/use-projects";
import { useEvents } from "@/hooks/use-events";
import { usePageTitle } from "@/hooks/use-page-title";

const fadeUp = (visible: boolean, delay = 0): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? "translateY(0)" : "translateY(40px)",
  transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
});

const fadeIn = (visible: boolean, delay = 0): React.CSSProperties => ({
  opacity: visible ? 1 : 0,
  transition: `opacity 1s ease ${delay}s`,
});

export default function HomePage() {
  usePageTitle();
  const { t, lang } = useI18n();
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [vidIdx, setVidIdx] = useState(0);
  const videos = ["/drone1.MP4", "/drone2.mp4"];

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(id);
  }, []);

  const handleEnded = () => setVidIdx(p => (p + 1) % videos.length);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.src = videos[vidIdx];
    v.load();
    v.play().catch(() => { });
  }, [vidIdx]);

  return (
    <div>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
        <TopNavOnly />
      </div>

      {/* ── HERO ── */}
      <div style={{ position: "relative", height: "100vh" }} className="notranslate">
        <video
          ref={videoRef}
          src={videos[0]}
          autoPlay muted playsInline
          onEnded={handleEnded}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ overflow: "hidden" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.50) 40%, rgba(0,0,0,0.75) 100%)" }} />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-12" style={{ zIndex: 10 }}>
          <div style={fadeIn(visible, 0)}>
            <p className="text-white/60 mb-3 uppercase tracking-[0.25em]" style={{ fontSize: "0.6rem", fontWeight: 700 }}>
              {t.brand}
            </p>
          </div>
          <div style={fadeUp(visible, 0.1)}>
            <h1 className="text-white mb-3 drop-shadow-lg"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontSize: "clamp(1.45rem, 3.2vw, 2.4rem)", fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.01em", textShadow: "0 2px 24px rgba(0,0,0,0.6)", maxWidth: "36ch" }}>
              {t.home.heroTitle}
            </h1>
            <div style={fadeIn(visible, 0.3)} className="w-10 h-[2px] bg-white mx-auto mb-6 opacity-40" />
          </div>
          <div style={fadeUp(visible, 0.22)}>
            <p className="text-white/85 mb-10 drop-shadow"
              style={{ fontSize: "clamp(1rem, 2.2vw, 1.15rem)", fontWeight: 400, lineHeight: 1.7, maxWidth: "44ch", textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}>
              {t.home.heroSubtitle}
            </p>
          </div>
          <div style={fadeUp(visible, 0.34)} className="flex flex-wrap gap-3 justify-center">
            <Link href="/projects"
              className="inline-flex items-center gap-2 h-11 px-7 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-all duration-200">
              <ArrowRight className="h-3.5 w-3.5" /> {t.home.exploreProjects}
            </Link>
            <Link href="/events"
              className="inline-flex items-center gap-2 h-11 px-7 bg-transparent text-white text-xs font-bold uppercase tracking-wider border border-white/50 hover:bg-white/10 hover:border-white transition-all duration-200">
              <ArrowRight className="h-3.5 w-3.5" /> {t.home.exploreEvents}
            </Link>
            <Link href="/gallery"
              className="inline-flex items-center gap-2 h-11 px-7 bg-transparent text-white text-xs font-bold uppercase tracking-wider border border-white/50 hover:bg-white/10 hover:border-white transition-all duration-200">
              <Images className="h-3.5 w-3.5" /> {t.labels.gallery}
            </Link>
          </div>
        </div>
      </div>

      {/* ── PRAYASVAN FEATURED BANNER ── */}
      <section className="px-6 sm:px-12 md:px-20 lg:px-32 pt-16 pb-0 notranslate">
        <a href="/projects/prayas-one" className="group relative block w-full rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500" style={{ height: "clamp(320px, 45vw, 560px)" }}>
          <img src="/Map.png" alt="Prayasvan" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.25) 75%, rgba(0,0,0,0.1) 100%)" }} />
          <div className="absolute inset-0 flex flex-col justify-center px-10 sm:px-16 md:px-20">
            <h2 className="text-white font-bold mb-5 drop-shadow-2xl" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2.2rem, 5.5vw, 4.5rem)", lineHeight: 1.08, letterSpacing: "-0.025em", textShadow: "0 4px 32px rgba(0,0,0,0.7)" }}>
              {t.labels.prayasvanTitle}
            </h2>
            <p className="text-white/85 mb-8 drop-shadow-lg" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.2rem)", maxWidth: "48ch", lineHeight: 1.7, textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}>
              {t.labels.prayasvanDesc}
            </p>
            <span className="inline-flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider text-white border border-white/50 px-7 py-3.5 rounded-full w-fit group-hover:bg-white group-hover:text-black shadow-sm transition-all duration-300">
              <ArrowRight className="h-4 w-4" /> Explore Prayasvan
            </span>
          </div>
        </a>
      </section>

      {/* ── PROJECTS & EVENTS ── */}
      <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-16">
        <div className="mb-12">
          <div className="flex items-end justify-between mb-6 notranslate">
            <div>
              <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-1 whitespace-nowrap">{t.home.projectsLabel}</p>
              <h2 className="text-foreground font-bold" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}>{t.home.initiatives}</h2>
            </div>
            <Link href="/projects" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              {t.home.viewAll} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ProjectCards lang={lang} />
        </div>

        <div>
          <div className="flex items-end justify-between mb-6 notranslate">
            <div>
              <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-1 whitespace-nowrap">{t.home.eventsLabel}</p>
              <h2 className="text-foreground font-bold" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}>{t.home.glimpses}</h2>
            </div>
            <Link href="/events" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              {t.home.viewAll} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <EventCards lang={lang} />
        </div>
      </section>

      {/* ── YOUTUBE VIDEOS ── */}
      <YouTubeSection />

      <Footer />
    </div>
  );
}

function Carousel({ children, count }: { children: React.ReactNode[]; count: number }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visible = 4;
  const max = Math.max(0, count - visible);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count <= 1) return;
    timerRef.current = setInterval(() => setIdx(i => i >= max ? 0 : i + 1), 3000);
  }, [max, count]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const handlePrev = () => { setIdx(i => Math.max(i - 1, 0)); resetTimer(); };
  const handleNext = () => { setIdx(i => Math.min(i + 1, max)); resetTimer(); };

  return (
    <div className="relative px-5">
      <div className="overflow-hidden">
        <div
          className="flex gap-4 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(calc(-${idx} * (25% + 4px)))` }}
        >
          {children.map((child, i) => (
            <div key={i} className="shrink-0 w-[calc(25%-3px)]">{child}</div>
          ))}
        </div>
      </div>
      <button
        onClick={handlePrev}
        disabled={idx === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button
        onClick={handleNext}
        disabled={idx === max}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ProjectCards({ lang }: { lang: "en" | "hi" | "mr" }) {
  const q = useProjects({ lang });
  const { t } = useI18n();
  const projects = (q.data || []).filter(it => !(it.project as any).isArchived);

  const projectCards = q.isLoading
    ? [1, 2, 3].map(i => <div key={i} className="aspect-[3/4] shimmer bg-muted rounded-xl" />)
    : projects.map(it => {
        const tr = it.translations.find((t: any) => t.language === lang) || it.translations[0];
        const title = (tr as any)?.title || "Untitled";
        return (
          <a key={it.project.id} href={`/projects/${it.project.id}`}
            className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-muted block shadow-sm hover:shadow-xl transition-shadow duration-300">
            {it.project.coverImagePath
              ? <img src={it.project.coverImagePath} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              : <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/60" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-bold text-sm leading-snug line-clamp-2 drop-shadow-sm">{title}</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[hsl(var(--kesari))] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </a>
        );
      });

  return <Carousel count={projectCards.length}>{projectCards}</Carousel>;
}

function EventCards({ lang }: { lang: "en" | "hi" | "mr" }) {
  const q = useEvents({ lang });
  const { t } = useI18n();
  const events = (q.data || []);

  if (q.isLoading) {
    const skeletons = [1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] shimmer bg-muted rounded-xl" />);
    return <Carousel count={4}>{skeletons}</Carousel>;
  }

  if (events.length === 0) {
    return <p className="text-muted-foreground text-sm">{t.empty.events}</p>;
  }

  const cards = events.map((it: any) => {
    const tr = it.translations?.find((t: any) => t.language === lang) || it.translations?.[0];
    const title = tr?.title || it.event?.title || "Untitled";
    const cover = it.event?.coverImagePath;
    const id = it.event?.id;
    return (
      <a key={id} href={`/events/${id}`}
        className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-muted block shadow-sm hover:shadow-xl transition-shadow duration-300">
        {cover
          ? <img src={cover} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
          : <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/60" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-bold text-sm leading-snug line-clamp-2 drop-shadow-sm">{title}</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[hsl(var(--kesari))] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </a>
    );
  });

  return <Carousel count={cards.length}>{cards}</Carousel>;
}

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]{11})/);
  return m ? m[1] : null;
}

function YouTubeSection() {
  const [videos, setVideos] = useState<{ id: number; url: string; title: string }[]>([]);
  const [active, setActive] = useState(0);
  const { t, lang } = useI18n();

  useEffect(() => {
    fetch(`/api/youtube-videos?lang=${lang}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setVideos(data);
          setActive(0);
        }
      })
      .catch(() => { });
  }, [lang]);

  if (!videos.length) return null;

  const current = videos[active];
  const vid = getYouTubeId(current.url);

  return (
    <section className="py-16 border-t border-border notranslate">
      <div className="px-6 sm:px-12 md:px-20 lg:px-32 mb-6 notranslate">
        <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-1 whitespace-nowrap">{t.home.videos}</p>
        <h2 className="text-foreground font-bold" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em" }}>{t.home.watch}</h2>
      </div>

      <div className="px-6 sm:px-12 md:px-20 lg:px-32">
        <div className="relative w-full rounded-xl overflow-hidden border border-border" style={{ paddingBottom: "52%" }}>
          {vid ? (
            <iframe
              key={vid}
              src={`https://www.youtube.com/embed/${vid}?rel=0`}
              title={current.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <p className="text-muted-foreground text-sm">{t.home.invalidVideo}</p>
            </div>
          )}
        </div>
      </div>

      {videos.length > 1 && (
        <div className="px-6 sm:px-12 md:px-20 lg:px-32 mt-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {videos.map((v, i) => {
              const thumbId = getYouTubeId(v.url);
              return (
                <button key={v.id} onClick={() => setActive(i)}
                  className={`shrink-0 w-48 text-left rounded-xl overflow-hidden border transition-all ${i === active ? "border-[hsl(var(--kesari))] shadow-md" : "border-border hover:border-foreground"
                    }`}>
                  {thumbId ? (
                    <img src={`https://img.youtube.com/vi/${thumbId}/mqdefault.jpg`}
                      alt={v.title} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-muted" />
                  )}
                  <div className="p-2">
                    <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">{v.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
