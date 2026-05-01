import { Shell } from "@/components/Shell";
import { useI18n } from "@/hooks/use-i18n";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

import { usePageTitle } from "@/hooks/use-page-title";

export default function AboutPage() {
  const { t } = useI18n();
  usePageTitle("About");

  return (
    <Shell>
      <div>

        {/* ── HERO — forabout.png bg with overlay ── */}
        <section className="w-full pt-16 pb-14 px-6 sm:px-12 md:px-20 lg:px-32 relative overflow-hidden notranslate"
          style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          {/* bg image */}
          <div className="absolute inset-0 z-0">
            <img src="/forabout.png" alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.65)" }} />
          </div>
          <div className="max-w-4xl animate-fadeUp relative z-10">
            <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-5 whitespace-nowrap">
              {t.home.aboutUs}
            </p>
            <h1 style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.03em" }}
              className="text-foreground mb-6">
              {t.about.title}
            </h1>
            <p className="text-foreground/80" style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", fontWeight: 400, lineHeight: 1.7, maxWidth: "52ch" }}>
              {t.about.subtitle}
            </p>
          </div>
        </section>

        {/* ── CONTENT ── */}
        <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-14 notranslate">

          <div className="animate-fadeUp space-y-10">

            <img src="/logo.png" alt="Prayas Yavatmal" className="h-24 w-auto object-contain mx-auto" />

            <p className="text-foreground/80 leading-[1.85]" style={{ fontSize: "clamp(1rem, 1.6vw, 1.1rem)" }}>
              {t.about.content1}{" "}
              <span className="font-semibold text-foreground">"{t.brand}"</span>
            </p>

            <p className="text-foreground/80 leading-[1.85]" style={{ fontSize: "clamp(1rem, 1.6vw, 1.1rem)" }}>
              {t.about.content2}
            </p>

            {/* Pull quote */}
            <blockquote className="border-l-[3px] border-[hsl(var(--kesari))] pl-8 py-2">
              <p className="text-foreground/90 leading-[1.8]" style={{ fontSize: "clamp(1.05rem, 1.8vw, 1.2rem)", fontWeight: 500 }}>
                <span className="font-bold text-foreground">{t.about.drName}</span>, {t.about.content3}
              </p>
            </blockquote>

            <p className="text-foreground/80 leading-[1.85]" style={{ fontSize: "clamp(1rem, 1.6vw, 1.1rem)" }}>
              {t.about.content4}{" "}
              <span className="font-semibold text-foreground">"{t.home.seedQuote}"</span>{" "}
              {t.about.content4b}
            </p>

          </div>
        </section>

        {/* ── PROJECTS DIVIDER ── */}
        <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-14 border-t border-border notranslate">
          <div className="animate-fadeUp">
            <div className="w-10 h-[3px] bg-[hsl(var(--kesari))] mb-8" />
            <h2 className="text-foreground mb-6" style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {t.about.projectsTitle}
            </h2>
            <p className="text-foreground/70 leading-[1.85] mb-10" style={{ fontSize: "clamp(1rem, 1.6vw, 1.1rem)" }}>
              {t.about.projectsDesc}
            </p>
            <Link href="/projects"
              className="inline-flex items-center gap-2 h-11 px-7 bg-transparent text-foreground text-sm font-semibold uppercase tracking-wider border-2 border-foreground hover:bg-foreground hover:text-background transition-all duration-200">
              {t.about.viewProjects} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── JOIN MISSION ── */}
        <section className="px-6 sm:px-12 md:px-20 lg:px-32 py-24 border-t border-border bg-foreground notranslate">
          <div className="animate-fadeUp">
            <p className="text-sm font-bold text-[hsl(var(--kesari))] mb-5 whitespace-nowrap">
              {t.about.joinMission}
            </p>
            <p className="text-background/70 leading-[1.85]" style={{ fontSize: "clamp(1rem, 1.8vw, 1.15rem)" }}>
              {t.about.joinDesc}
            </p>
            <div className="mt-10">
              <Link href="/donate"
                className="inline-flex items-center gap-2 h-11 px-7 bg-transparent text-white text-sm font-semibold uppercase tracking-wider border-2 border-white/40 hover:bg-white/10 hover:border-white/70 transition-all duration-200">
                {t.nav.donate} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </Shell>
  );
}
