import { PropsWithChildren, useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LanguageSwitcher, triggerGoogleTranslate, LANG_OPTIONS } from "@/components/LanguageSwitcher";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/hooks/use-auth";
import { useAdminMe } from "@/hooks/use-admins";
import {
  LayoutDashboard, CalendarDays, FolderKanban, Shield,
  LogOut, Menu, X, Images, BarChart3, ArrowRight, Users, Youtube
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/ThemeProvider";

function Brand() {
  const { t } = useI18n();
  return (
    <Link href="/" className="flex items-center flex-shrink-0">
      <span className="inline-flex items-center gap-2 pointer-events-none">
        <img src="/logoshort.png" alt="" className="h-7 w-auto object-contain" />
        <span className="text-white font-semibold text-base tracking-wide">{t.brand}</span>
      </span>
    </Link>
  );
}

function TopNav() {
  const { t, lang, setLang } = useI18n();
  const [loc] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: adminMe } = useAdminMe();
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/",         label: t.nav.home     },
    { href: "/projects", label: t.nav.projects  },
    { href: "/events",   label: t.nav.events    },
    { href: "/about",    label: t.nav.about     },
    { href: "/donate",   label: t.nav.donate    },
  ];

  const showAdmin = isAuthenticated && adminMe?.isAdmin;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 notranslate" style={{ background: "#000000", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
      {/* Admin context banner — visible on public pages when logged in as admin */}
      {showAdmin && !loc.startsWith("/admin") && (
        <div className="w-full border-b border-[hsl(var(--kesari))]/30 bg-[hsl(var(--kesari))]/10">
          <div className="w-full max-w-[1500px] mx-auto px-6 lg:px-14 h-8 flex items-center justify-between gap-4">
            <span className="text-[11px] font-semibold text-[hsl(var(--kesari))] uppercase tracking-wider">
              {t.labels.adminHeading}
            </span>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[hsl(var(--kesari))] hover:text-white transition-colors uppercase tracking-wider"
            >
              <LayoutDashboard className="h-3 w-3" />
              {t.labels.adminPanel}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1500px] mx-auto px-6 lg:px-14 h-14 flex items-center justify-between gap-6">
        <Brand />

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0">
          {nav.map((n) => {
            const active = loc === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "px-4 py-5 text-[15px] font-medium border-b-2 transition-all duration-150",
                  active
                    ? "border-[hsl(var(--kesari))] text-[hsl(var(--kesari))]"
                    : "border-transparent text-white/70 hover:text-white hover:border-white/30"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/gallery">
              <button className="h-8 px-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-white border border-white/25 hover:border-white/60 transition-all">
                <Images className="h-3 w-3" />
                <span className="hidden md:inline">{t.labels.gallery}</span>
              </button>
            </Link>
            <LanguageSwitcher compact />
            <AuthButtons />
          </div>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden h-9 w-9 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[360px] p-0 border-l border-border overflow-y-auto">
              <div className="flex flex-col min-h-full bg-background">
                {/* Header */}
                <div className="flex items-center justify-between px-6 h-14 border-b border-border" style={{ background: "#000000" }}>
                  <span className="inline-flex items-center gap-2">
                    <img src="/logoshort.png" alt="" className="h-7 w-auto object-contain" />
                    <span className="text-white font-semibold text-base tracking-wide">{t.brand}</span>
                  </span>
                  <button onClick={() => setOpen(false)} className="h-9 w-9 flex items-center justify-center text-white/60 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-6 py-6 space-y-1">
                  {showAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-3.5 text-sm font-semibold text-[hsl(var(--kesari))] border-l-2 border-[hsl(var(--kesari))] bg-[hsl(var(--kesari-light))] mb-4"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {t.labels.adminPanel}
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </Link>
                  )}
                  {nav.map((n) => {
                    const active = loc === n.href;
                    return (
                      <Link
                        key={n.href}
                        href={n.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-3.5 text-sm font-medium border-l-2 transition-all",
                          active
                            ? "border-[hsl(var(--kesari))] text-[hsl(var(--kesari))] bg-[hsl(var(--kesari-light))]"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                      >
                        {n.label}
                        {active && <ArrowRight className="h-3.5 w-3.5" />}
                      </Link>
                    );
                  })}
                </nav>

                {/* Bottom */}
                <div className="px-6 py-6 border-t border-border space-y-3">
                  <Link
                    href="/gallery"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 transition-all"
                  >
                    <span>{t.labels.gallery}</span>
                    <Images className="h-4 w-4" />
                  </Link>
                  <div className="flex items-center justify-between px-4 py-3 border border-border">
                    <span className="text-sm font-medium text-muted-foreground">{t.labels.language}</span>
                    <div className="flex items-center gap-1">
                      {LANG_OPTIONS.map(({ code, native }) => (
                          <button
                            key={code}
                            onClick={() => { setLang(code); triggerGoogleTranslate(code); }}
                            className={cn(
                              "h-8 px-3 text-xs font-semibold border transition-all",
                              lang === code
                                ? "border-[hsl(var(--kesari))] text-[hsl(var(--kesari))] bg-[hsl(var(--kesari-light))]"
                                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                            )}
                          >
                            {native}
                          </button>
                        ))}
                    </div>
                  </div>
                  <AuthButtons mobile />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function AuthButtons({ mobile }: { mobile?: boolean }) {
  const { t } = useI18n();
  const { user, isAuthenticated, isLoading, logout, isLoggingOut } = useAuth();

  if (isLoading) return <div className="h-8 w-24 bg-muted shimmer" />;

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => (window.location.href = "/admin/login")}
        className={cn(
          "h-8 px-4 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider border border-white/25 text-white hover:border-white/60 transition-all",
          mobile && "w-full justify-center h-10 mt-1"
        )}
      >
        {t.actions.login}
        <ArrowRight className="h-3 w-3" />
      </button>
    );
  }

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Admin";

  if (mobile) {
    return (
      <div className="space-y-2 mt-1">
        <div className="flex items-center gap-3 px-4 py-3 border border-border">
          <div className="h-8 w-8 bg-[hsl(var(--kesari))] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
        <button
          disabled={isLoggingOut}
          onClick={() => logout()}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-muted-foreground border border-border hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {t.actions.logout}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden lg:flex items-center gap-2 h-8 px-3 border border-white/25">
        <div className="h-5 w-5 bg-[hsl(var(--kesari))] flex items-center justify-center text-white text-xs font-bold">
          {name.slice(0, 1).toUpperCase()}
        </div>
        <span className="text-xs font-medium text-white max-w-[100px] truncate">{name}</span>
      </div>
      <button
        disabled={isLoggingOut}
        onClick={() => logout()}
        className="h-8 w-8 flex items-center justify-center text-white/60 border border-white/25 hover:text-white hover:border-white/60 transition-all disabled:opacity-50"
        title={t.actions.logout}
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function TopNavOnly() {
  return <TopNav />;
}

export function Shell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-app flex flex-col">
      <TopNav />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function AdminAuthButtons() {
  const { t } = useI18n();
  const { user, isAuthenticated, isLoading, logout, isLoggingOut } = useAuth();
  if (isLoading) return <div className="h-7 w-24 shimmer opacity-30" />;
  if (!isAuthenticated) return null;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Admin";
  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 h-7 px-3 border border-white/25">
        <div className="h-4 w-4 bg-[hsl(var(--kesari))] flex items-center justify-center text-white text-[10px] font-bold">
          {name.slice(0, 1).toUpperCase()}
        </div>
        <span className="text-xs font-medium text-white max-w-[100px] truncate">{name}</span>
      </div>
      <button disabled={isLoggingOut} onClick={() => logout()}
        className="h-7 w-7 flex items-center justify-center text-white/60 border border-white/25 hover:text-white hover:border-white/60 transition-all disabled:opacity-50"
        title={t.actions.logout}>
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function AdminShell({ children }: PropsWithChildren) {
  const [loc] = useLocation();
  const { t } = useI18n();
  const { data: adminMe } = useAdminMe();
  const role = adminMe?.role;
  const adminName = (adminMe as any)?.username || (adminMe as any)?.email || "Admin";

  const items = [
    { href: "/admin",           label: "Dashboard",    icon: LayoutDashboard, superOnly: false },
    { href: "/admin/projects",  label: "Projects",     icon: FolderKanban,    superOnly: false },
    { href: "/admin/events",    label: "Events",       icon: CalendarDays,    superOnly: false },
    { href: "/admin/analytics", label: "Analytics",    icon: BarChart3,       superOnly: false },
    { href: "/admin/team",      label: "Team Prayas",  icon: Users,           superOnly: false },
    { href: "/admin/youtube",   label: "YouTube",      icon: Youtube,         superOnly: false },
    { href: "/admin/admins",    label: "Admins",       icon: Shield,          superOnly: true  },
  ] as const;

  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Admin top bar */}
      <div className="sticky top-0 z-50 border-b border-border notranslate" style={{ background: "#000" }}>
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-12 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              ← {t.nav.home}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <AdminAuthButtons /></div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-[1400px] mx-auto px-6 lg:px-12 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-20 h-fit">
            <div className="border border-border bg-card">
              <div className="px-4 py-3 border-b border-border bg-muted/40">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Admin</div>
                <div className="text-sm font-semibold text-foreground capitalize mt-0.5">{adminName}</div>
                <div className="text-xs text-muted-foreground capitalize mt-0.5">{role?.replace("_", " ") || "—"}</div>
              </div>
              <nav className="p-2">
                {items
                  .filter((i) => !i.superOnly || role === "super_admin")
                  .map((i) => {
                    const active = loc === i.href;
                    const Icon = i.icon;
                    return (
                      <Link
                        key={i.href}
                        href={i.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm font-medium border-l-2 transition-all duration-150 mb-0.5",
                          active
                            ? "border-[hsl(var(--kesari))] text-[hsl(var(--kesari))] bg-[hsl(var(--kesari-light))]"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-[hsl(var(--kesari))]" : "")} />
                        {i.label}
                      </Link>
                    );
                  })}
              </nav>
            </div>
          </aside>

          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}
