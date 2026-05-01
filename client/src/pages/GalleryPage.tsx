import { Shell } from "@/components/Shell";
import { useI18n } from "@/hooks/use-i18n";
import { useProjects } from "@/hooks/use-projects";
import { useEvents } from "@/hooks/use-events";
import { useMemo, useState } from "react";
import { Image as ImageIcon, FolderKanban, CalendarDays } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";

type Section = {
  id: number;
  title: string;
  type: "project" | "event";
  items: LightboxItem[];
};

export default function GalleryPage() {
  const { lang, t } = useI18n();
  usePageTitle("Gallery");
  const { data: projects } = useProjects({ lang });
  const { data: events } = useEvents({ lang });

  // lightbox state: which section + which index within it
  const [lb, setLb] = useState<{ sectionIdx: number; itemIdx: number } | null>(null);

  const sections = useMemo<Section[]>(() => {
    const result: Section[] = [];

    projects?.forEach((item) => {
      const tr = item.translations.find((t) => t.language === lang) || item.translations[0];
      const gallery: string[] = ((item.project as any).galleryImages as string[] | null) || [];
      const urls: string[] = [...gallery];
      if ((item.project as any).youtubeUrl) urls.push((item.project as any).youtubeUrl);
      if (urls.length > 0)
        result.push({ id: item.project.id, title: tr?.title || "Untitled", type: "project", items: urls.map((url) => ({ url, label: tr?.title || "Photo" })) });
    });

    events?.forEach((item) => {
      const tr = item.translations.find((t) => t.language === lang) || item.translations[0];
      const gallery: string[] = ((item.event as any).galleryImages as string[] | null) || [];
      if (gallery.length > 0)
        result.push({ id: item.event.id, title: tr?.title || "Untitled", type: "event", items: gallery.map((url) => ({ url, label: tr?.title || "Photo" })) });
    });

    return result;
  }, [projects, events, lang]);

  const totalImages = sections.reduce((s, sec) => s + sec.items.length, 0);
  const activeSection = lb !== null ? sections[lb.sectionIdx] : null;

  return (
    <Shell>
      <div>
        {/* Header */}
        <section className="pt-14 pb-12 px-6 sm:px-12 md:px-20 lg:px-32 border-b border-border animate-fadeUp">
          <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-4 whitespace-nowrap">{t.labels.gallery}</p>
          <h1 className="text-foreground mb-4" style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)", fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em" }}>
            {t.labels.gallery}
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", lineHeight: 1.7 }}>
            {totalImages} {totalImages === 1 ? t.home.photoFrom : t.home.photosFrom} {sections.length} {sections.length === 1 ? "source" : "sources"}
          </p>
        </section>

        {/* Sections */}
        <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-14 animate-fadeUp space-y-16">
          {sections.length === 0 ? (
            <div className="border border-dashed border-border p-20 text-center">
              <ImageIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
              <p className="font-semibold text-muted-foreground">{t.home.noImagesYet}</p>
              <p className="text-sm text-muted-foreground/60 mt-1">{t.home.noImagesDesc}</p>
            </div>
          ) : (
            sections.map((sec, sIdx) => (
              <div key={`${sec.type}-${sec.id}`}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-[2px] bg-[hsl(var(--kesari))]" />
                  <div className="flex items-center gap-2">
                    {sec.type === "project"
                      ? <FolderKanban className="h-3.5 w-3.5 text-muted-foreground" />
                      : <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    }
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{sec.title}</span>
                    <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider">· {sec.type}</span>
                  </div>
                </div>

                {/* Image grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border">
                  {sec.items.map((item, iIdx) => (
                    <button key={iIdx}
                      className="group relative aspect-square overflow-hidden bg-muted cursor-pointer focus:outline-none"
                      onClick={() => setLb({ sectionIdx: sIdx, itemIdx: iIdx })}>
                      {/youtube\.com|youtu\.be/.test(item.url) ? (
                        <>
                          <img
                            src={`https://img.youtube.com/vi/${item.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1]}/hqdefault.jpg`}
                            alt="Video"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-black/60 flex items-center justify-center">
                              <svg className="h-4 w-4 text-white fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        <img src={item.url} alt={`${sec.title} ${iIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end">
                        <div className="p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <span className="text-white/60 text-[10px] uppercase tracking-wider">{iIdx + 1} / {sec.items.length}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Lightbox — navigates within section + between sections */}
      {lb !== null && activeSection && (
        <Lightbox
          items={activeSection.items}
          index={lb.itemIdx}
          sectionTitle={activeSection.title}
          onClose={() => setLb(null)}
          onNav={(i) => setLb({ sectionIdx: lb.sectionIdx, itemIdx: i })}
          onPrevSection={lb.sectionIdx > 0 ? () => setLb({ sectionIdx: lb.sectionIdx - 1, itemIdx: 0 }) : undefined}
          onNextSection={lb.sectionIdx < sections.length - 1 ? () => setLb({ sectionIdx: lb.sectionIdx + 1, itemIdx: 0 }) : undefined}
        />
      )}
    </Shell>
  );
}
