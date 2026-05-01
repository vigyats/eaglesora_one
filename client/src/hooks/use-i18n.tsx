
import { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from "react";
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import mr from "@/locales/mr.json";

export type Lang = "en" | "hi" | "mr";

const STORAGE_KEY = "ngo.lang";
const VALID_LANGS: Lang[] = ["en", "hi", "mr"];

const dict = { en, hi, mr } as const;

function getLangFromCookie(): Lang | null {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!match) return null;
  const parts = match[1].split("/");
  const code = parts[parts.length - 1] as Lang;
  return VALID_LANGS.includes(code) ? code : null;
}

function getInitialLang(): Lang {
  const fromCookie = getLangFromCookie();
  if (fromCookie) return fromCookie;
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  return stored && VALID_LANGS.includes(stored) ? stored : "en";
}

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof en;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [lang, setLang] = useState<Lang>(getInitialLang);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => dict[lang], [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
