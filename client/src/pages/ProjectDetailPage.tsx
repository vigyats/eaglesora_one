import { Shell } from "@/components/Shell";
import { useI18n } from "@/hooks/use-i18n";
import { useProject } from "@/hooks/use-projects";
import { useParams, Link } from "wouter";
import { ArrowLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Lightbox, type LightboxItem } from "@/components/Lightbox";
import { usePageTitle } from "@/hooks/use-page-title";
import PrayasvanPage from "@/pages/PrayasvanPage";

function pick<T extends { language: string; title: string; summary?: string | null; contentHtml: string }>(
  translations: T[], lang: "en" | "hi" | "mr",
) {
  return translations.find((t) => t.language === lang) || translations.find((t) => t.language === "en") || translations[0] || null;
}

export default function ProjectDetailPage() {
  const params = useParams() as { id?: string };
  const id = Number(params.id);
  const { lang, t } = useI18n();
  const queryClient = useQueryClient();
  
  // Invalidate project query when language changes to force refetch
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: [api.projects.get.path, id] });
  }, [lang, id, queryClient]);
  
  const q = useProject(id, { lang });
  const data = q.data as any;
  const tr = data?.translations ? pick(data.translations, lang) : null;
  const isFallback = tr !== null && tr.language !== lang;
  usePageTitle(tr?.title || "Project");

  // Static Prayasvan page — intercept by slug or by the hardcoded href
  if (params.id === "prayas-one" || data?.project?.slug === "prayas-one") {
    return <PrayasvanPage />;
  }

  const [lbIndex, setLbIndex] = useState<number | null>(null);

  // All media items for this project (cover excluded — it's the thumbnail)
  const mediaItems = useMemo<LightboxItem[]>(() => {
    if (!data?.project) return [];
    const items: LightboxItem[] = [];
    const gallery: string[] = (data.project.galleryImages as string[] | null) || [];
    gallery.forEach((url) => items.push({ url, label: tr?.title || "Photo" }));
    if (data.project.youtubeUrl) items.push({ url: data.project.youtubeUrl, label: "Video" });
    return items;
  }, [data, tr]);

  return (
    <Shell>
      <div>
        {/* Back */}
        <div className="px-6 sm:px-12 md:px-20 lg:px-32 pt-8 pb-0">
          <Link href="/projects" className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> {t.home.backToProjects}
          </Link>
        </div>

        {q.isLoading ? (
          <div className="px-6 sm:px-12 md:px-20 lg:px-32 py-14 space-y-4">
            <div className="h-8 w-2/3 shimmer" />
            <div className="h-4 w-1/2 shimmer" />
            <div className="h-64 shimmer mt-8" />
          </div>
        ) : q.isError || !data?.project ? (
          <div className="px-6 sm:px-12 md:px-20 lg:px-32 py-14">
            <p className="text-muted-foreground">{t.home.projectNotFound}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <section className="px-6 sm:px-12 md:px-20 lg:px-32 pt-12 pb-10 border-b border-border">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[hsl(var(--kesari))] mb-4">{t.home.projectLabel}</p>
              <h1 className="text-foreground mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.8rem)", fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em" }}>
                {tr?.title || "Untitled"}
              </h1>
              {tr?.summary && (
                <p className="text-muted-foreground" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", maxWidth: "58ch", lineHeight: 1.7 }}>
                  {tr.summary}
                </p>
              )}
            </section>

            {/* Body */}
            <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-14">
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {mediaItems.map((item, i) => (
                      <button key={i} onClick={() => setLbIndex(i)}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-muted focus:outline-none">
                        {/youtube\.com|youtu\.be/.test(item.url) ? (
                          <>
                            <img
                              src={`https://img.youtube.com/vi/${item.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1]}/hqdefault.jpg`}
                              alt="Video"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="h-10 w-10 rounded-full bg-black/60 flex items-center justify-center">
                                <svg className="h-4 w-4 text-white fill-white ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                              </div>
                            </div>
                          </>
                        ) : (
                          <img src={item.url} alt={`Photo ${i + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {lbIndex !== null && (
        <Lightbox items={mediaItems} index={lbIndex} onClose={() => setLbIndex(null)} onNav={setLbIndex} />
      )}
    </Shell>
  );
}
