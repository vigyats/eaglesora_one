import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import type { Lang } from "@/hooks/use-i18n";

export const LANG_OPTIONS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi",   native: "हिन्दी"  },
  { code: "mr", label: "Marathi", native: "मराठी"   },
];

function setGoogTransCookie(langCode: Lang) {
  const value = langCode === "en" ? "/en/en" : `/en/${langCode}`;
  const host = window.location.hostname;
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `googtrans=${value}; expires=${expires}; path=/; SameSite=Lax`;
  if (host !== "localhost") {
    document.cookie = `googtrans=${value}; expires=${expires}; path=/; domain=${host}; SameSite=Lax`;
    document.cookie = `googtrans=${value}; expires=${expires}; path=/; domain=.${host}; SameSite=Lax`;
  }
}

export function triggerGoogleTranslate(langCode: Lang) {
  setGoogTransCookie(langCode);

  const tryCombo = (attempts = 0) => {
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    // Retry up to 3s; if Google Translate widget never loads, cookie is already set
    // and will apply on next navigation — no forced reload needed
    if (attempts < 15) setTimeout(() => tryCombo(attempts + 1), 200);
  };

  tryCombo();
}

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);

  const current = LANG_OPTIONS.find((o) => o.code === lang);

  function handleSelect(code: Lang) {
    setOpen(false);
    setLang(code);
    triggerGoogleTranslate(code);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="h-8 px-3 flex items-center gap-1.5 text-sm font-semibold text-white border border-white/25 hover:border-white/60 transition-all">
          <Languages className="h-3.5 w-3.5 text-white pointer-events-none" />
          <span className="pointer-events-none">{current?.native}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-48 p-2 rounded-xl border-border/70 bg-popover/95 shadow-lg backdrop-blur"
        style={{ zIndex: 9999 }}
      >
        <p className="text-xs font-semibold text-muted-foreground px-2 pb-2">Select language</p>
        <div className="space-y-0.5">
          {LANG_OPTIONS.map((o) => (
            <button key={o.code} onClick={() => handleSelect(o.code)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted",
                lang === o.code ? "bg-muted text-foreground" : "text-foreground/80"
              )}>
              <div className="text-sm font-semibold">{o.native}</div>
              <div className="text-xs text-muted-foreground">{o.label}</div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
