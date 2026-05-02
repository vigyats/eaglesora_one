type Lang = "en" | "hi" | "mr";

const MS_CODES: Record<Lang, string> = { en: "en", hi: "hi", mr: "mr" };

async function callTranslate(texts: string[], fromLang: Lang, toLang: Lang): Promise<string[]> {
  if (texts.every((t) => !t.trim())) return texts;
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Pass fromLang so Azure uses explicit source — prevents Marathi/Hindi
    // text with English words being misidentified as English
    body: JSON.stringify({ texts, fromLang: MS_CODES[fromLang], toLang: MS_CODES[toLang] }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Session expired — please log in again.");
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.translated as string[];
}

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function wrapHtml(text: string): string {
  return `<p>${text.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
}

export type TranslateFields = {
  title: string;
  summary: string;
  contentHtml: string;
  location?: string;
  introduction?: string;
  requirements?: string;
};

export async function translateContent(
  source: TranslateFields,
  fromLang: Lang,
  toLangs: Lang[]
): Promise<Record<Lang, TranslateFields>> {
  const result: Record<string, TranslateFields> = {
    [fromLang]: source,
  };

  const targets = toLangs.filter((l) => l !== fromLang);
  if (!targets.length) return result as Record<Lang, TranslateFields>;

  const plainContent = stripHtml(source.contentHtml);

  for (const toLang of targets) {
    const texts = [
      source.title,
      source.summary || "",
      plainContent,
      source.location || "",
      source.introduction || "",
      source.requirements || "",
    ];

    const [title, summary, content, location, introduction, requirements] =
      await callTranslate(texts, fromLang, toLang);

    result[toLang] = {
      title,
      summary,
      contentHtml: content ? wrapHtml(content) : "",
      location: source.location ? location : undefined,
      introduction: source.introduction ? introduction : undefined,
      requirements: source.requirements ? requirements : undefined,
    };
  }

  return result as Record<Lang, TranslateFields>;
}
