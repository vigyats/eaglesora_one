/**
 * audit-and-fix-translations.ts
 *
 * 1. Fetches all projects + events from DB
 * 2. Reports which are missing HI / MR translations
 * 3. Batches ALL missing fields into the fewest possible API calls
 *    (Microsoft Translator accepts up to 100 texts per request)
 * 4. Writes the translated rows back to DB
 *
 * Run: tsx script/audit-and-fix-translations.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { eq, inArray } from "drizzle-orm";
import { db } from "../server/db.js";
import {
  projects, projectTranslations,
  events, eventTranslations,
} from "../shared/schema.js";

type Lang = "hi" | "mr";
const LANGS: Lang[] = ["hi", "mr"];
const MS_ENDPOINT = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0";
const BATCH_SIZE = 100; // Microsoft Translator max texts per request

// ─── Translator ──────────────────────────────────────────────────────────────

async function translateBatch(texts: string[], toLang: Lang): Promise<string[]> {
  const key = process.env.MICROSOFT_TRANSLATOR_KEY;
  const region = process.env.MICROSOFT_TRANSLATOR_REGION || "global";
  if (!key) throw new Error("MICROSOFT_TRANSLATOR_KEY not set in .env");

  const res = await fetch(`${MS_ENDPOINT}&to=${toLang}`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Ocp-Apim-Subscription-Region": region,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(texts.map((t) => ({ Text: t }))),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Translator API ${res.status}: ${body}`);
  }

  const data = (await res.json()) as Array<{ translations: Array<{ text: string }> }>;
  return data.map((item) => item.translations[0]?.text ?? "");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function wrapHtml(text: string): string {
  return `<p>${text.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>")}</p>`;
}

// ─── Batch engine ─────────────────────────────────────────────────────────────
// Collects all texts that need translation, sends them in the fewest API calls
// possible (chunked at 100 per Microsoft's limit), then maps results back.

interface PendingText {
  text: string;
  onResult: (translated: string) => void;
}

async function runBatchedTranslation(pending: PendingText[], toLang: Lang) {
  if (!pending.length) return;

  let apiCalls = 0;
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const chunk = pending.slice(i, i + BATCH_SIZE);
    const translated = await translateBatch(chunk.map((p) => p.text), toLang);
    apiCalls++;
    chunk.forEach((p, idx) => p.onResult(translated[idx]));
  }

  console.log(`  → ${toLang.toUpperCase()}: ${pending.length} texts translated in ${apiCalls} API call(s)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n══════════════════════════════════════════");
  console.log("  Translation Audit & Fix");
  console.log("══════════════════════════════════════════\n");

  // ── Load all data ──────────────────────────────────────────────────────────
  const allProjects = await db.select().from(projects);
  const allProjectTrans = await db.select().from(projectTranslations);

  const projectTransByProject = new Map<number, typeof allProjectTrans>();
  for (const t of allProjectTrans) {
    const arr = projectTransByProject.get(t.projectId) ?? [];
    arr.push(t);
    projectTransByProject.set(t.projectId, arr);
  }

  const allEvents = await db.select().from(events);
  const allEventTrans = await db.select().from(eventTranslations);

  const eventTransByEvent = new Map<number, typeof allEventTrans>();
  for (const t of allEventTrans) {
    const arr = eventTransByEvent.get(t.eventId) ?? [];
    arr.push(t);
    eventTransByEvent.set(t.eventId, arr);
  }

  // ── Audit report ───────────────────────────────────────────────────────────
  console.log(`📦 Projects (${allProjects.length}):`);
  let projectIssues = 0;
  for (const p of allProjects) {
    const trans = projectTransByProject.get(p.id) ?? [];
    const langs = trans.map((t) => t.language);
    const missing = LANGS.filter((l) => !langs.includes(l));
    const hasEn = langs.includes("en");
    if (missing.length) {
      projectIssues++;
      console.log(`  ⚠  id=${p.id} slug="${p.slug}" — missing: [${missing.join(", ")}]${!hasEn ? " ← NO EN SOURCE" : ""}`);
    } else {
      console.log(`  ✓  id=${p.id} slug="${p.slug}" — EN/HI/MR ✓`);
    }
  }

  console.log(`\n📅 Events (${allEvents.length}):`);
  let eventIssues = 0;
  for (const e of allEvents) {
    const trans = eventTransByEvent.get(e.id) ?? [];
    const langs = trans.map((t) => t.language);
    const missing = LANGS.filter((l) => !langs.includes(l));
    const hasEn = langs.includes("en");
    if (missing.length) {
      eventIssues++;
      console.log(`  ⚠  id=${e.id} slug="${e.slug}" — missing: [${missing.join(", ")}]${!hasEn ? " ← NO EN SOURCE" : ""}`);
    } else {
      console.log(`  ✓  id=${e.id} slug="${e.slug}" — EN/HI/MR ✓`);
    }
  }

  const totalIssues = projectIssues + eventIssues;
  if (totalIssues === 0) {
    console.log("\n✅ All records have EN/HI/MR translations. Nothing to fix.\n");
    process.exit(0);
  }

  console.log(`\n🔧 ${totalIssues} record(s) need fixing. Preparing translations...\n`);

  // ── Build fix objects ──────────────────────────────────────────────────────

  type ProjectFix = {
    projectId: number; lang: Lang;
    status: "draft" | "published";
    title: string; summary: string | null; contentHtml: string;
    _src: { title: string; summary: string | null; plainContent: string };
  };

  type EventFix = {
    eventId: number; lang: Lang;
    status: "draft" | "published";
    title: string; summary: string | null; contentHtml: string;
    location: string | null; introduction: string | null; requirements: string | null;
    _src: { title: string; summary: string | null; plainContent: string; location: string | null; introduction: string | null; requirements: string | null };
  };

  const projectFixes: ProjectFix[] = [];
  const eventFixes: EventFix[] = [];

  for (const p of allProjects) {
    const trans = projectTransByProject.get(p.id) ?? [];
    const enTr = trans.find((t) => t.language === "en");
    if (!enTr) continue;
    const existingLangs = new Set(trans.map((t) => t.language));
    for (const lang of LANGS.filter((l) => !existingLangs.has(l))) {
      projectFixes.push({
        projectId: p.id, lang,
        status: enTr.status as "draft" | "published",
        title: "", summary: null, contentHtml: "",
        _src: { title: enTr.title, summary: enTr.summary ?? null, plainContent: stripHtml(enTr.contentHtml) },
      });
    }
  }

  for (const e of allEvents) {
    const trans = eventTransByEvent.get(e.id) ?? [];
    const enTr = trans.find((t) => t.language === "en");
    if (!enTr) continue;
    const existingLangs = new Set(trans.map((t) => t.language));
    for (const lang of LANGS.filter((l) => !existingLangs.has(l))) {
      eventFixes.push({
        eventId: e.id, lang,
        status: enTr.status as "draft" | "published",
        title: "", summary: null, contentHtml: "",
        location: null, introduction: null, requirements: null,
        _src: {
          title: enTr.title, summary: enTr.summary ?? null,
          plainContent: stripHtml(enTr.contentHtml),
          location: enTr.location ?? null,
          introduction: enTr.introduction ?? null,
          requirements: enTr.requirements ?? null,
        },
      });
    }
  }

  // ── Translate — one batched call per language ──────────────────────────────
  // All projects + events for the same target language go in ONE API call
  // (up to 100 texts). This is the most credit-efficient approach possible.

  for (const lang of LANGS) {
    const pending: PendingText[] = [];

    for (const fix of projectFixes.filter((f) => f.lang === lang)) {
      const s = fix._src;
      pending.push({ text: s.title,        onResult: (v) => { fix.title = v; } });
      if (s.summary)      pending.push({ text: s.summary,      onResult: (v) => { fix.summary = v; } });
      if (s.plainContent) pending.push({ text: s.plainContent, onResult: (v) => { fix.contentHtml = wrapHtml(v); } });
    }

    for (const fix of eventFixes.filter((f) => f.lang === lang)) {
      const s = fix._src;
      pending.push({ text: s.title,        onResult: (v) => { fix.title = v; } });
      if (s.summary)      pending.push({ text: s.summary,      onResult: (v) => { fix.summary = v; } });
      if (s.plainContent) pending.push({ text: s.plainContent, onResult: (v) => { fix.contentHtml = wrapHtml(v); } });
      if (s.location)     pending.push({ text: s.location,     onResult: (v) => { fix.location = v; } });
      if (s.introduction) pending.push({ text: s.introduction, onResult: (v) => { fix.introduction = v; } });
      if (s.requirements) pending.push({ text: s.requirements, onResult: (v) => { fix.requirements = v; } });
    }

    if (!pending.length) { console.log(`  → ${lang.toUpperCase()}: nothing to translate`); continue; }
    console.log(`🌐 Translating to ${lang.toUpperCase()} — ${pending.length} text(s)...`);
    await runBatchedTranslation(pending, lang);
  }

  // ── Write to DB ────────────────────────────────────────────────────────────
  console.log("\n💾 Writing to database...");

  for (const fix of projectFixes) {
    if (!fix.title) { console.log(`  ✗ project id=${fix.projectId} [${fix.lang}] — translation empty, skipped`); continue; }
    await db.insert(projectTranslations).values({
      projectId: fix.projectId,
      language: fix.lang,
      status: fix.status,
      title: fix.title,
      summary: fix.summary ?? null,
      contentHtml: fix.contentHtml || "<p></p>",
    }).onConflictDoNothing();
    console.log(`  ✓ project id=${fix.projectId} [${fix.lang}] "${fix.title.slice(0, 60)}"`);
  }

  for (const fix of eventFixes) {
    if (!fix.title) { console.log(`  ✗ event id=${fix.eventId} [${fix.lang}] — translation empty, skipped`); continue; }
    await db.insert(eventTranslations).values({
      eventId: fix.eventId,
      language: fix.lang,
      status: fix.status,
      title: fix.title,
      summary: fix.summary ?? null,
      contentHtml: fix.contentHtml || "<p></p>",
      location: fix.location ?? null,
      introduction: fix.introduction ?? null,
      requirements: fix.requirements ?? null,
    }).onConflictDoNothing();
    console.log(`  ✓ event id=${fix.eventId} [${fix.lang}] "${fix.title.slice(0, 60)}"`);
  }

  console.log("\n✅ Done.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
