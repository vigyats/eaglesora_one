import { Link } from "wouter";
import { useI18n } from "@/hooks/use-i18n";
import { useTheme } from "@/components/ThemeProvider";

export function Footer() {
  const { t } = useI18n();
  const { theme } = useTheme();

  return (
    <footer className="border-t border-border bg-muted/30 mt-0 notranslate">
      <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="space-y-4">
            <img src={theme === "dark" ? "/logo-1.png" : "/logo.png"} alt="Logo" className="h-10 w-auto" />
            <p className="text-sm text-muted-foreground leading-relaxed">{t.home.footerDesc}</p>
            <div className="w-10 h-0.5 bg-[hsl(var(--kesari))]" />
          </div>

          <div>
            <h6 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-5">{t.home.footerQuickLinks}</h6>
            <div className="space-y-3">
              {[
                { href: "/projects", label: t.nav.projects },
                { href: "/events",   label: t.nav.events   },
                { href: "/gallery",  label: t.labels.gallery },
                { href: "/about",    label: t.nav.about    },
                { href: "/donate",   label: t.nav.donate   },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="block text-sm text-muted-foreground hover:text-[hsl(var(--kesari))] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h6 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-5">{t.labels.contactUs}</h6>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="leading-relaxed">{t.home.footerAddress.split(',').map((line, i, arr) => (<span key={i}>{line.trim()}{i < arr.length - 1 && <br />}</span>))}</p>
              <a href="tel:+919423435090" className="block hover:text-[hsl(var(--kesari))] transition-colors">{t.home.footerPhone}</a>
              <a href="mailto:prayasyeotmal@gmail.com" className="block hover:text-[hsl(var(--kesari))] transition-colors break-all">prayasyeotmal@gmail.com</a>
            </div>
          </div>

          <div>
            <h6 className="text-xs font-semibold uppercase tracking-widest text-foreground mb-5">{t.home.footerConnect}</h6>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.home.footerConnectDesc}</p>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium">© {new Date().getFullYear()} {t.brand}. {t.home.footerRights}</p>
            <p className="text-xs text-foreground/70 mt-1">
              Website managed by:{" "}
              <a
                href="https://eaglesora.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-[hsl(var(--kesari))] underline underline-offset-2 transition-colors duration-150"
              >
                EagleSora Pvt Ltd.
              </a>
            </p>
          </div>
          <div className="flex gap-1">
            <span className="h-1 w-8 bg-[hsl(var(--tri-saffron))]" />
            <span className="h-1 w-8 bg-white border border-border" />
            <span className="h-1 w-8 bg-[hsl(var(--tri-green))]" />
          </div>
        </div>
      </div>
    </footer>
  );
}
