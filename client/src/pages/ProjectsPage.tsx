import { Shell } from "@/components/Shell";
import { useI18n } from "@/hooks/use-i18n";
import { useProjects } from "@/hooks/use-projects";
import { useMemo, useState } from "react";
import { Search, Star, ArrowRight, ImageOff } from "lucide-react";
import { Link } from "wouter";
import { usePageTitle } from "@/hooks/use-page-title";

function pickTranslation<T extends { language: string; title: string; summary?: string | null }>(
  translations: T[], lang: "en" | "hi" | "mr",
) {
  return translations.find((t) => t.language === lang) || translations.find((t) => t.language === "en") || translations[0] || null;
}

export default function ProjectsPage() {
  const { lang, t } = useI18n();
  usePageTitle("Projects");
  const q = useProjects({ lang });
  const [search, setSearch] = useState("");
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  const items = useMemo(() => {
    return (q.data || [])
      .filter((it) => {
        if (onlyFeatured && !it.project.isFeatured) return false;
        if (!search.trim()) return true;
        const tr = pickTranslation(it.translations as any[], lang);
        return `${tr?.title || ""} ${(tr as any)?.summary || ""}`.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        if (a.project.isFeatured !== b.project.isFeatured) return a.project.isFeatured ? -1 : 1;
        return new Date(b.project.createdAt as any).getTime() - new Date(a.project.createdAt as any).getTime();
      });
  }, [q.data, search, onlyFeatured, lang]);

  return (
    <Shell>
      <div>
        {/* Header */}
        <section className="pt-14 pb-12 px-6 sm:px-12 md:px-20 lg:px-32 border-b border-border animate-fadeUp notranslate">
          <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-4 whitespace-nowrap">{t.home.directory}</p>
          <h1 className="text-foreground mb-4" style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)", fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em" }}>
            {t.labels.allProjects}
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)", maxWidth: "50ch", lineHeight: 1.7 }}>
            {t.home.browseAll}
          </p>
        </section>

        {/* Filters */}
        <section className="px-6 sm:px-12 md:px-20 lg:px-32 pt-10 pb-0 animate-fadeUp notranslate">
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.home.searchPlaceholder}
                className="w-full h-11 pl-11 pr-4 bg-transparent border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
              />
            </div>
            <button
              onClick={() => setOnlyFeatured(v => !v)}
              className={`h-11 px-6 text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${onlyFeatured ? "bg-foreground text-background border-foreground" : "bg-transparent text-foreground border-border hover:border-foreground"}`}
            >
              {onlyFeatured ? t.home.featuredOnly : t.home.allProjectsBtn}
            </button>
          </div>
        </section>

        {/* Grid */}
        <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-10 animate-fadeUp">
          {q.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border">
                  <div className="aspect-[4/3] shimmer" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 w-3/4 shimmer rounded" />
                    <div className="h-3 w-1/2 shimmer rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : q.isError ? (
            <p className="text-muted-foreground text-sm">{t.home.couldNotLoadProjects}</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">{t.empty.projects}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {items.map((it) => {
                const tr = pickTranslation(it.translations as any[], lang);
                return (
                  <Link key={it.project.id} href={`/projects/${it.project.id}`}>
                    <div className="group rounded-2xl overflow-hidden cursor-pointer bg-card border border-border hover:border-[hsl(var(--kesari))]/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 flex flex-col h-full">
                      {/* Thumbnail */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted shrink-0">
                        {it.project.coverImagePath ? (
                          <img
                            src={it.project.coverImagePath}
                            alt={tr?.title || ""}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                            <ImageOff className="w-10 h-10 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        {it.project.isFeatured && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 bg-[hsl(var(--kesari))] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                            <Star className="w-3 h-3 fill-white" /> {t.labels.featured}
                          </div>
                        )}
                        <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-md">
                          <ArrowRight className="w-4 h-4 text-black" />
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-[hsl(var(--kesari))] transition-colors duration-200">
                          {tr?.title || "Untitled"}
                        </h3>
                        <p className="text-muted-foreground text-xs mt-2 line-clamp-2 leading-relaxed flex-1">
                          {(tr as any)?.summary || "\u00a0"}
                        </p>
                        <p className="text-[10px] font-semibold text-muted-foreground/50 mt-3 uppercase tracking-widest">
                          {it.project.projectDate
                            ? new Date(it.project.projectDate as any).toLocaleDateString(
                                lang === "hi" ? "hi-IN-u-nu-deva" : lang === "mr" ? "mr-IN-u-nu-deva" : "en-IN",
                                { year: "numeric", month: "long" }
                              )
                            : "\u00a0"}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
