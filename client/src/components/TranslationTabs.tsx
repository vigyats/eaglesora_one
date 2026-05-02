import { ReactNode, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Lang } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { translateContent, type TranslateFields } from "@/lib/translate";
import { Loader2, Sparkles } from "lucide-react";

const labels: Record<Lang, { short: string; native: string }> = {
  en: { short: "EN", native: "English" },
  hi: { short: "HI", native: "हिन्दी" },
  mr: { short: "MR", native: "मराठी" },
};

export function TranslationTabs({
  activeLang,
  onChangeLang,
  render,
  headerRight,
  // source fields for auto-translate
  getSourceFields,
  onTranslated,
}: {
  activeLang: Lang;
  onChangeLang: (l: Lang) => void;
  render: (lang: Lang) => ReactNode;
  headerRight?: ReactNode;
  /** Return the current EN field values to translate from */
  getSourceFields?: () => TranslateFields;
  /** Called with translated results for hi + mr */
  onTranslated?: (results: Record<Lang, TranslateFields>) => void;
}) {
  const langs: Lang[] = ["en", "hi", "mr"];
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAutoTranslate() {
    if (!getSourceFields || !onTranslated) return;
    const source = getSourceFields();
    if (!source.title.trim()) {
      setError("Add an English title before translating.");
      return;
    }
    setError(null);
    setTranslating(true);
    try {
      const results = await translateContent(source, "en", ["hi", "mr"]);
      onTranslated(results);
    } catch (err) {
      const msg = (err as Error).message || "";
      setError(
        msg.includes("Session expired")
          ? msg
          : msg.includes("authentication failed")
          ? "Translation service authentication failed. Contact admin."
          : "Auto-translation failed. Please try again or fill in manually."
      );
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="rounded-3xl border bg-card shadow-[var(--shadow-lg)] overflow-hidden">
      <div className="p-4 border-b bg-background/60 flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold">Translations</div>
          <div className="text-xs text-muted-foreground">
            Maintain EN/HI/MR variants. Publish per language independently.
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {getSourceFields && onTranslated && (
            <button
              type="button"
              onClick={handleAutoTranslate}
              disabled={translating}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold border border-[hsl(var(--kesari))]/60 text-[hsl(var(--kesari))] hover:bg-[hsl(var(--kesari))]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              {translating
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Sparkles className="h-3 w-3" />}
              {translating ? "Translating…" : "Auto-translate"}
            </button>
          )}
          {headerRight}
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="p-4 md:p-5">
        <Tabs value={activeLang} onValueChange={(v) => onChangeLang(v as Lang)}>
          <TabsList className={cn("grid w-full grid-cols-3 rounded-2xl bg-muted/50 p-1")}>
            {langs.map((l) => (
              <TabsTrigger
                key={l}
                value={l}
                className={cn(
                  "rounded-xl font-semibold",
                  "data-[state=active]:bg-background data-[state=active]:shadow-[var(--shadow-sm)]",
                )}
              >
                <span className="mr-2 inline-flex h-5 items-center rounded-md border bg-background px-1.5 text-[11px] font-bold">
                  {labels[l].short}
                </span>
                <span className="text-sm">{labels[l].native}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {langs.map((l) => (
            <TabsContent key={l} value={l} className="mt-4">
              {render(l)}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
