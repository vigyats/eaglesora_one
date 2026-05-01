/**
 * test-language-system.ts
 * Full language system test — static JSON + dynamic DB content
 * Run: tsx script/test-language-system.ts
 */

import dotenv from "dotenv";
dotenv.config();

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "../server/db.js";
import { projects, projectTranslations, events, eventTranslations, youtubeVideos } from "../shared/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;
const failures: string[] = [];

function pass(msg: string) { passed++; console.log(`  ✓ ${msg}`); }
function fail(msg: string) { failed++; failures.push(msg); console.log(`  ✗ ${msg}`); }
function section(title: string) { console.log(`\n${"─".repeat(52)}\n  ${title}\n${"─".repeat(52)}`); }

// ─── helpers ──────────────────────────────────────────────────────────────────

function flatKeys(obj: any, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) return [full];
    if (typeof v === "object" && v !== null) return flatKeys(v, full);
    return [full];
  });
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

// ─── SUITE 1: Static JSON key parity ─────────────────────────────────────────

section("SUITE 1 — Static JSON key parity (en / hi / mr)");

const localesDir = join(__dirname, "../client/src/locales");
const en = JSON.parse(readFileSync(join(localesDir, "en.json"), "utf-8"));
const hi = JSON.parse(readFileSync(join(localesDir, "hi.json"), "utf-8"));
const mr = JSON.parse(readFileSync(join(localesDir, "mr.json"), "utf-8"));

const enKeys = flatKeys(en);
const hiKeys = new Set(flatKeys(hi));
const mrKeys = new Set(flatKeys(mr));

let missingInHi = 0, missingInMr = 0;
for (const key of enKeys) {
  if (!hiKeys.has(key)) { fail(`hi.json missing key: "${key}"`); missingInHi++; }
  if (!mrKeys.has(key)) { fail(`mr.json missing key: "${key}"`); missingInMr++; }
}
if (missingInHi === 0) pass(`hi.json has all ${enKeys.length} keys from en.json`);
if (missingInMr === 0) pass(`mr.json has all ${enKeys.length} keys from en.json`);

// ─── SUITE 2: Static JSON values are non-empty ────────────────────────────────

section("SUITE 2 — Static JSON values non-empty");

const LANGS = ["en", "hi", "mr"] as const;
const dicts: Record<string, any> = { en, hi, mr };

for (const lang of LANGS) {
  const keys = flatKeys(dicts[lang]);
  const empty = keys.filter(k => {
    const v = getNestedValue(dicts[lang], k);
    return typeof v === "string" && v.trim() === "";
  });
  // tagline is intentionally a single space — allow it
  const realEmpty = empty.filter(k => k !== "tagline");
  if (realEmpty.length === 0) {
    pass(`${lang}.json — no empty string values`);
  } else {
    realEmpty.forEach(k => fail(`${lang}.json empty value at key: "${k}"`));
  }
}

// ─── SUITE 3: Static JSON — correct script per language ──────────────────────

section("SUITE 3 — Correct script per language (spot checks)");

// Hindi must use Devanagari
const hiDevanagari = /[\u0900-\u097F]/;
const hiSpotKeys = ["nav.home", "home.heroTitle", "labels.events", "donate.title"];
for (const key of hiSpotKeys) {
  const val = getNestedValue(hi, key);
  if (hiDevanagari.test(val)) pass(`hi "${key}" contains Devanagari`);
  else fail(`hi "${key}" = "${val}" — expected Devanagari script`);
}

// Marathi must use Devanagari
const mrSpotKeys = ["nav.home", "home.heroTitle", "labels.events", "donate.title"];
for (const key of mrSpotKeys) {
  const val = getNestedValue(mr, key);
  if (hiDevanagari.test(val)) pass(`mr "${key}" contains Devanagari`);
  else fail(`mr "${key}" = "${val}" — expected Devanagari script`);
}

// English must NOT contain Devanagari
const enSpotKeys = ["nav.home", "home.heroTitle", "labels.events", "donate.title"];
for (const key of enSpotKeys) {
  const val = getNestedValue(en, key);
  if (!hiDevanagari.test(val)) pass(`en "${key}" is Latin script`);
  else fail(`en "${key}" = "${val}" — unexpected Devanagari in English`);
}

// ─── SUITE 4: Static JSON — hi ≠ mr ≠ en (not copy-pasted) ──────────────────

section("SUITE 4 — Languages are distinct (hi ≠ mr ≠ en)");

const compareKeys = ["home.heroTitle", "nav.projects", "donate.title", "about.subtitle"];
for (const key of compareKeys) {
  const enVal = getNestedValue(en, key);
  const hiVal = getNestedValue(hi, key);
  const mrVal = getNestedValue(mr, key);
  if (enVal !== hiVal) pass(`"${key}": en ≠ hi`);
  else fail(`"${key}": hi is identical to en — not translated`);
  if (enVal !== mrVal) pass(`"${key}": en ≠ mr`);
  else fail(`"${key}": mr is identical to en — not translated`);
  if (hiVal !== mrVal) pass(`"${key}": hi ≠ mr`);
  else fail(`"${key}": hi and mr are identical — likely copy-paste`);
}

// ─── SUITE 5: DB — all projects have EN + HI + MR ────────────────────────────

section("SUITE 5 — DB projects: all 3 languages present");

const allProjects = await db.select().from(projects);
const allProjTrans = await db.select().from(projectTranslations);

const projTransMap = new Map<number, Set<string>>();
for (const t of allProjTrans) {
  const s = projTransMap.get(t.projectId) ?? new Set();
  s.add(t.language);
  projTransMap.set(t.projectId, s);
}

for (const p of allProjects) {
  const langs = projTransMap.get(p.id) ?? new Set();
  const missing = (["en", "hi", "mr"] as const).filter(l => !langs.has(l));
  if (missing.length === 0) {
    pass(`project id=${p.id} slug="${p.slug.slice(0, 30)}" — EN/HI/MR ✓`);
  } else {
    fail(`project id=${p.id} slug="${p.slug.slice(0, 30)}" — missing [${missing.join(", ")}]`);
  }
}

// ─── SUITE 6: DB — all events have EN + HI + MR ──────────────────────────────

section("SUITE 6 — DB events: all 3 languages present");

const allEvents = await db.select().from(events);
const allEventTrans = await db.select().from(eventTranslations);

const eventTransMap = new Map<number, Set<string>>();
for (const t of allEventTrans) {
  const s = eventTransMap.get(t.eventId) ?? new Set();
  s.add(t.language);
  eventTransMap.set(t.eventId, s);
}

for (const e of allEvents) {
  const langs = eventTransMap.get(e.id) ?? new Set();
  const missing = (["en", "hi", "mr"] as const).filter(l => !langs.has(l));
  if (missing.length === 0) {
    pass(`event id=${e.id} slug="${e.slug}" — EN/HI/MR ✓`);
  } else {
    fail(`event id=${e.id} slug="${e.slug}" — missing [${missing.join(", ")}]`);
  }
}

// ─── SUITE 7: DB — translation fields non-empty ───────────────────────────────

section("SUITE 7 — DB translation fields non-empty");

for (const t of allProjTrans) {
  if (!t.title?.trim()) fail(`project_translations id=${t.id} [${t.language}] — title is empty`);
  else pass(`project_translations id=${t.id} [${t.language}] title non-empty`);
  if (!t.contentHtml?.trim()) fail(`project_translations id=${t.id} [${t.language}] — contentHtml is empty`);
  else pass(`project_translations id=${t.id} [${t.language}] contentHtml non-empty`);
}

for (const t of allEventTrans) {
  if (!t.title?.trim()) fail(`event_translations id=${t.id} [${t.language}] — title is empty`);
  else pass(`event_translations id=${t.id} [${t.language}] title non-empty`);
  if (!t.contentHtml?.trim()) fail(`event_translations id=${t.id} [${t.language}] — contentHtml is empty`);
  else pass(`event_translations id=${t.id} [${t.language}] contentHtml non-empty`);
}

// ─── SUITE 8: DB — HI/MR titles differ from EN (actually translated) ─────────

section("SUITE 8 — DB translations are actually translated (hi ≠ en, mr ≠ en)");

const devanagari = /[\u0900-\u097F]/;

for (const p of allProjects) {
  const trans = allProjTrans.filter(t => t.projectId === p.id);
  const enTr = trans.find(t => t.language === "en");
  if (!enTr) continue;
  // If EN title is already in Devanagari (admin entered native script), skip diff check
  if (devanagari.test(enTr.title)) {
    pass(`project id=${p.id} — EN title is Devanagari, diff check skipped`);
    continue;
  }
  for (const lang of ["hi", "mr"] as const) {
    const tr = trans.find(t => t.language === lang);
    if (!tr) continue;
    if (tr.title !== enTr.title) {
      pass(`project id=${p.id} [${lang}] title differs from EN`);
    } else {
      fail(`project id=${p.id} [${lang}] title is IDENTICAL to EN — not translated`);
    }
  }
}

for (const e of allEvents) {
  const trans = allEventTrans.filter(t => t.eventId === e.id);
  const enTr = trans.find(t => t.language === "en");
  if (!enTr) continue;
  // If EN title is already in Devanagari (admin entered native script), skip diff check
  if (devanagari.test(enTr.title)) {
    pass(`event id=${e.id} — EN title is Devanagari, diff check skipped (admin entered native script)`);
    continue;
  }
  for (const lang of ["hi", "mr"] as const) {
    const tr = trans.find(t => t.language === lang);
    if (!tr) continue;
    if (tr.title !== enTr.title) {
      pass(`event id=${e.id} [${lang}] title differs from EN`);
    } else {
      fail(`event id=${e.id} [${lang}] title is IDENTICAL to EN — not translated`);
    }
  }
}

// ─── SUITE 9: DB — YouTube videos have HI + MR titles ────────────────────────

section("SUITE 9 — YouTube videos: HI + MR titles present");

const allVideos = await db.select().from(youtubeVideos);
for (const v of allVideos) {
  if (v.titleHi?.trim()) pass(`youtube id=${v.id} titleHi present`);
  else fail(`youtube id=${v.id} titleHi is empty/null`);
  if (v.titleMr?.trim()) pass(`youtube id=${v.id} titleMr present`);
  else fail(`youtube id=${v.id} titleMr is empty/null`);
}
if (allVideos.length === 0) pass("No YouTube videos in DB — skipped");

// ─── SUITE 10: i18n hook logic (pure logic, no DOM) ──────────────────────────

section("SUITE 10 — i18n hook logic (pure)");

// Simulate getInitialLang logic
function getInitialLang(stored: string | null): string {
  const VALID = ["en", "hi", "mr"];
  return stored && VALID.includes(stored) ? stored : "en";
}

if (getInitialLang("hi") === "hi") pass("getInitialLang('hi') → 'hi'");
else fail("getInitialLang('hi') should return 'hi'");

if (getInitialLang("mr") === "mr") pass("getInitialLang('mr') → 'mr'");
else fail("getInitialLang('mr') should return 'mr'");

if (getInitialLang("en") === "en") pass("getInitialLang('en') → 'en'");
else fail("getInitialLang('en') should return 'en'");

if (getInitialLang(null) === "en") pass("getInitialLang(null) → 'en' (default)");
else fail("getInitialLang(null) should default to 'en'");

if (getInitialLang("fr") === "en") pass("getInitialLang('fr') → 'en' (invalid lang defaults)");
else fail("getInitialLang('fr') should default to 'en'");

if (getInitialLang("") === "en") pass("getInitialLang('') → 'en' (empty defaults)");
else fail("getInitialLang('') should default to 'en'");

// dict lookup
const dictTest: Record<string, any> = { en, hi, mr };
for (const lang of ["en", "hi", "mr"] as const) {
  const t = dictTest[lang];
  if (t && t.brand) pass(`dict["${lang}"].brand = "${t.brand}"`);
  else fail(`dict["${lang}"].brand is missing`);
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────

console.log(`\n${"═".repeat(52)}`);
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(52)}`);

if (failures.length) {
  console.log("\n  Failed tests:");
  failures.forEach(f => console.log(`    ✗ ${f}`));
}

console.log();
process.exit(failed > 0 ? 1 : 0);
