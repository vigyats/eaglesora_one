import dotenv from "dotenv";
dotenv.config();
import { db } from "../server/db.js";
import { projects, projectTranslations } from "../shared/schema.js";

const allPT = await db.select().from(projectTranslations);
const allP = await db.select().from(projects);

console.log("\n=== ALL projects with their translation language coverage ===");
for (const p of allP) {
  const trans = allPT.filter(t => t.projectId === p.id);
  const langs = trans.map(t => t.language).join(", ") || "NONE";
  const missing = ["en","hi","mr"].filter(l => !trans.find(t => t.language === l));
  if (missing.length) {
    console.log(`  ⚠ id=${p.id} slug="${p.slug.slice(0,40)}" langs=[${langs}] MISSING=[${missing.join(",")}]`);
    for (const t of trans) {
      console.log(`      [${t.language}] title="${t.title}" contentHtml="${(t.contentHtml||"").slice(0,80)}"`);
    }
  }
}
process.exit(0);
