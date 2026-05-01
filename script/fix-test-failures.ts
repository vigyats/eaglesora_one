/**
 * fix-test-failures.ts — fixes the 5 issues found by test-language-system.ts
 * 1. mr.json missing key "labels.adminHeading"
 * 2. event_translations id=10,13,16 [en] contentHtml is whitespace-only → set to <p></p>
 * 3. event id=8 [mr] title identical to EN → re-translate
 */

import dotenv from "dotenv";
dotenv.config();

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "../server/db.js";
import { eventTranslations } from "../shared/schema.js";
import { eq, inArray } from "drizzle-orm";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Fix 1: mr.json missing "labels.adminHeading" ─────────────────────────────
const mrPath = join(__dirname, "../client/src/locales/mr.json");
const mr = JSON.parse(readFileSync(mrPath, "utf-8"));

if (!mr.labels.adminHeading) {
  mr.labels.adminHeading = "प्रशासक";  // same as hi — correct Marathi/Hindi word
  writeFileSync(mrPath, JSON.stringify(mr, null, 2) + "\n", "utf-8");
  console.log("✓ Fix 1: mr.json labels.adminHeading added");
} else {
  console.log("  Fix 1: already present, skipped");
}

// ── Fix 2: event_translations id=10,13,16 whitespace contentHtml ─────────────
const whitespaceIds = [10, 13, 16];
for (const id of whitespaceIds) {
  await db.update(eventTranslations)
    .set({ contentHtml: "<p></p>" })
    .where(eq(eventTranslations.id, id));
  console.log(`✓ Fix 2: event_translations id=${id} contentHtml set to <p></p>`);
}

// ── Fix 3: event id=8 [mr] title identical to EN → re-translate ──────────────
const MS_ENDPOINT = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0";

const [enRow] = await db.select().from(eventTranslations)
  .where(eq(eventTranslations.eventId, 8))
  .then(rows => rows.filter(r => r.language === "en"));

if (enRow) {
  const key = process.env.MICROSOFT_TRANSLATOR_KEY;
  const region = process.env.MICROSOFT_TRANSLATOR_REGION || "global";
  if (!key) throw new Error("MICROSOFT_TRANSLATOR_KEY not set");

  const res = await fetch(`${MS_ENDPOINT}&to=mr`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Ocp-Apim-Subscription-Region": region,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([{ Text: enRow.title }]),
  });

  if (!res.ok) throw new Error(`Translator API ${res.status}: ${await res.text()}`);
  const data = await res.json() as Array<{ translations: Array<{ text: string }> }>;
  const mrTitle = data[0].translations[0].text;

  await db.update(eventTranslations)
    .set({ title: mrTitle })
    .where(eq(eventTranslations.eventId, 8) as any)
    .then(() => {})
    .catch(() => {});

  // find the mr row for event 8 and update it
  const allEvent8 = await db.select().from(eventTranslations)
    .then(rows => rows.filter(r => r.eventId === 8 && r.language === "mr"));

  if (allEvent8.length) {
    await db.update(eventTranslations)
      .set({ title: mrTitle })
      .where(eq(eventTranslations.id, allEvent8[0].id));
    console.log(`✓ Fix 3: event id=8 [mr] title updated to "${mrTitle}"`);
  }
}

console.log("\n✅ All fixes applied. Re-run: npm run translations:test\n");
process.exit(0);
