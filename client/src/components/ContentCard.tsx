import { Link } from "wouter";
import { ArrowUpRight, CalendarDays } from "lucide-react";

export function ContentCard({
  title, subtitle, href, coverImagePath, meta, featured,
}: {
  title: string;
  subtitle?: string | null;
  href: string;
  coverImagePath?: string | null;
  meta?: string;
  featured?: boolean;
}) {
  return (
    <Link href={href}>
      <div className="group flex items-stretch bg-card hover:bg-muted/40 transition-colors duration-200 cursor-pointer border-b border-border last:border-b-0 min-h-[88px]">

        {/* Kesari left accent bar */}
        <div className="w-[3px] shrink-0 bg-transparent group-hover:bg-[hsl(var(--kesari))] transition-colors duration-200" />

        {/* Image */}
        {coverImagePath && (
          <div className="shrink-0 w-[88px] self-stretch overflow-hidden bg-muted">
            <img src={coverImagePath} alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex items-center justify-between gap-4 px-5 py-4 min-w-0">
          <div className="min-w-0 space-y-1">
            {featured && (
              <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] text-[hsl(var(--kesari))]">
                ★ Featured
              </span>
            )}
            <p className="font-semibold text-foreground text-sm sm:text-[0.95rem] leading-snug group-hover:text-[hsl(var(--kesari))] transition-colors duration-200 line-clamp-1">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">{subtitle}</p>
            )}
            {meta && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <CalendarDays className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                <span className="text-[11px] text-muted-foreground/60 font-medium">{meta}</span>
              </div>
            )}
          </div>

          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-[hsl(var(--kesari))] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
        </div>

      </div>
    </Link>
  );
}
