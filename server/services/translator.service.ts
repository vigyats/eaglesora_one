const MS_ENDPOINT = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0";

export type Lang = "en" | "hi" | "mr";
export const ALL_LANGS: Lang[] = ["en", "hi", "mr"];

// Microsoft Translator language codes
const MS_LANG_CODE: Record<Lang, string> = {
  en: "en",
  hi: "hi",
  mr: "mr",
};

export type TranslatableFields = {
  title: string;
  summary?: string | null;
  contentHtml: string;
  location?: string | null;
  introduction?: string | null;
  requirements?: string | null;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function wrapHtml(text: string): string {
  return `<p>${text.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
}

/**
 * Single API call to Microsoft Translator.
 * - fromLang: explicit source language (the tab the admin is currently on).
 *   Using explicit source instead of auto-detect gives better results for
 *   mixed-language input (e.g. Marathi text with English words).
 * - toLangs: all target languages in one request (cheaper — 1 call).
 * Returns translated texts indexed by target language.
 */
async function callTranslator(
  texts: string[],
  fromLang: Lang,
  toLangs: Lang[]
): Promise<Record<Lang, string[]>> {
  const key = process.env.MICROSOFT_TRANSLATOR_KEY;
  const region = process.env.MICROSOFT_TRANSLATOR_REGION || "global";

  if (!key) throw new Error("MICROSOFT_TRANSLATOR_KEY is not set");

  // All target languages in one request: &to=en&to=hi&to=mr
  const toParams = toLangs.map((l) => `to=${MS_LANG_CODE[l]}`).join("&");
  const fromParam = `from=${MS_LANG_CODE[fromLang]}`;
  const url = `${MS_ENDPOINT}&${fromParam}&${toParams}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Ocp-Apim-Subscription-Region": region,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(texts.map((t) => ({ Text: t }))),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Translator API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as Array<{
    translations: Array<{ text: string; to: string }>;
  }>;

  const result: Record<string, string[]> = {};
  for (const lang of toLangs) {
    result[lang] = data.map(
      (item) => item.translations.find((t) => t.to === MS_LANG_CODE[lang])?.text ?? ""
    );
  }

  return result as Record<Lang, string[]>;
}

/**
 * Translate all content fields to all 3 languages.
 *
 * Strategy:
 * - submittedLang: the tab the admin saved from (en/hi/mr).
 *   Used as explicit source language for accurate translation of mixed input.
 * - The submitted language row stores the admin's original text unchanged.
 * - The other 2 languages are translated in a single API call.
 *
 * Why explicit source over auto-detect:
 * - Auto-detect fails on mixed-language text (e.g. Marathi with English terms).
 * - Explicit source tells Azure the dominant language, producing better output.
 * - Admin controls the source by choosing which tab to save from.
 */
export async function autoTranslateFields(
  source: TranslatableFields,
  submittedLang: Lang = "en"
): Promise<Record<Lang, TranslatableFields>> {
  const plainContent = stripHtml(source.contentHtml);

  const fields = [
    source.title,
    source.summary || "",
    plainContent,
    source.location || "",
    source.introduction || "",
    source.requirements || "",
  ];

  // Only translate to the other 2 languages — submitted one is kept as-is
  const targetLangs = ALL_LANGS.filter((l) => l !== submittedLang);
  const translations = await callTranslator(fields, submittedLang, targetLangs);

  const result: Record<string, TranslatableFields> = {};

  for (const lang of ALL_LANGS) {
    if (lang === submittedLang) {
      // Preserve admin's original text exactly
      result[lang] = { ...source };
    } else {
      const t = translations[lang];
      result[lang] = {
        title: t[0],
        summary: source.summary ? t[1] : null,
        contentHtml: plainContent ? wrapHtml(t[2]) : "",
        location: source.location ? t[3] : null,
        introduction: source.introduction ? t[4] : null,
        requirements: source.requirements ? t[5] : null,
      };
    }
  }

  return result as Record<Lang, TranslatableFields>;
}
