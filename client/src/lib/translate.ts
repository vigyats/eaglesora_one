type Lang = "en" | "hi" | "mr";

const MS_CODES: Record<Lang, string> = { en: "en", hi: "hi", mr: "mr" };

// ─── Post-processing: fix common robotic patterns ────────────────────────────
// Microsoft Translator tends to produce overly literal translations for
// Hindi and Marathi. These replacements fix the most common issues.

const HI_FIXES: [RegExp, string][] = [
  // Robotic connectors
  [/\bके द्वारा\b/g, "द्वारा"],
  [/\bके साथ साथ\b/g, "साथ ही"],
  [/\bइस प्रकार से\b/g, "इस तरह"],
  [/\bकिया जाता है\b/g, "होता है"],
  [/\bकिया गया है\b/g, "किया गया"],
  [/\bप्रदान किया जाता है\b/g, "दिया जाता है"],
  [/\bउपलब्ध कराया जाता है\b/g, "उपलब्ध है"],
  [/\bके अंतर्गत\b/g, "के तहत"],
  [/\bसंबंधित है\b/g, "से जुड़ा है"],
  [/\bआयोजित किया जाएगा\b/g, "होगा"],
  [/\bआयोजित किया गया\b/g, "आयोजित हुआ"],
  [/\bप्रतिभागियों को\b/g, "प्रतिभागियों को"],
  [/\bके लिए पंजीकरण\b/g, "का पंजीकरण"],
  [/\bनिम्नलिखित\b/g, "निम्न"],
];

const MR_FIXES: [RegExp, string][] = [
  // Marathi-specific robotic patterns
  [/\bद्वारे\b/g, "द्वारा"],
  [/\bकेले जाते\b/g, "केले जाते"],
  [/\bकरण्यात येते\b/g, "केले जाते"],
  [/\bकरण्यात आले\b/g, "केले गेले"],
  [/\bउपलब्ध करून दिले जाते\b/g, "उपलब्ध आहे"],
  [/\bयाद्वारे\b/g, "यामुळे"],
  [/\bखालीलप्रमाणे\b/g, "खालील"],
  [/\bआयोजित केले जाईल\b/g, "होणार आहे"],
  [/\bआयोजित केले गेले\b/g, "आयोजित झाले"],
  [/\bसहभागींना\b/g, "सहभागींना"],
  [/\bनोंदणीसाठी\b/g, "नोंदणीसाठी"],
  [/\bसंबंधित आहे\b/g, "संबंधित आहे"],
  [/\bप्रदान केले जाते\b/g, "दिले जाते"],
  // Fix English word order bleeding into Marathi
  [/\bहे आहे की\b/g, "असे आहे की"],
  [/\bआहे की\b(?! \w)/g, "आहे"],
];

function postProcess(text: string, lang: Lang): string {
  if (!text) return text;
  const fixes = lang === "hi" ? HI_FIXES : lang === "mr" ? MR_FIXES : [];
  let out = text;
  for (const [pattern, replacement] of fixes) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// ─── Batch translate: both hi + mr in ONE API call ───────────────────────────

async function callTranslateBatch(
  texts: string[],
  fromLang: Lang,
  toLangs: Lang[]
): Promise<Record<Lang, string[]>> {
  if (texts.every((t) => !t.trim())) {
    const empty: Record<string, string[]> = {};
    for (const l of toLangs) empty[l] = texts;
    return empty as Record<Lang, string[]>;
  }

  const toParams = toLangs.map((l) => `to=${MS_CODES[l]}`).join("&");
  const fromParam = `from=${MS_CODES[fromLang]}`;

  const res = await fetch(
    `/api/translate-batch?${fromParam}&${toParams}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ texts }),
    }
  );

  if (!res.ok) {
    if (res.status === 401) throw new Error("Session expired — please log in again.");
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  const data = await res.json() as Record<Lang, string[]>;
  // Apply post-processing to improve naturalness
  const result: Record<string, string[]> = {};
  for (const lang of toLangs) {
    result[lang] = (data[lang] || []).map((t) => postProcess(t, lang));
  }
  return result as Record<Lang, string[]>;
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function wrapHtml(text: string): string {
  return `<p>${text.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

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
  const result: Record<string, TranslateFields> = { [fromLang]: source };

  const targets = toLangs.filter((l) => l !== fromLang);
  if (!targets.length) return result as Record<Lang, TranslateFields>;

  const plainContent = stripHtml(source.contentHtml);

  const texts = [
    source.title,
    source.summary || "",
    plainContent,
    source.location || "",
    source.introduction || "",
    source.requirements || "",
  ];

  // Single batch call for all target languages at once
  const translations = await callTranslateBatch(texts, fromLang, targets);

  for (const toLang of targets) {
    const t = translations[toLang];
    result[toLang] = {
      title:        t[0],
      summary:      t[1],
      contentHtml:  t[2] ? wrapHtml(t[2]) : "",
      location:     source.location     ? t[3] : undefined,
      introduction: source.introduction ? t[4] : undefined,
      requirements: source.requirements ? t[5] : undefined,
    };
  }

  return result as Record<Lang, TranslateFields>;
}
