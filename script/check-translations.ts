import { db } from "../server/db.js";
import { projects, projectTranslations } from "../shared/schema.js";

const ps = await db.select().from(projects);
const ts = await db.select().from(projectTranslations);

console.log("\n=== PROJECTS ===");
for (const p of ps) {
  console.log(`  id=${p.id} slug=${p.slug}`);
}

console.log("\n=== TRANSLATIONS ===");
for (const t of ts) {
  console.log(`  projectId=${t.projectId} lang=${t.language} title="${t.title}" summary="${(t.summary || "").slice(0, 60)}"`);
}

process.exit(0);
