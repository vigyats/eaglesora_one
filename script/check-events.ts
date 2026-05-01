import { db } from "../server/db.js";
import { events, eventTranslations } from "../shared/schema.js";

const allEvents = await db.select().from(events);
const allTrans = await db.select().from(eventTranslations);

console.log(`\n=== EVENTS (${allEvents.length}) ===`);
for (const e of allEvents) {
  console.log(`\n  id=${e.id} slug="${e.slug}"`);
  console.log(`    startDate=${e.startDate} endDate=${e.endDate}`);
  console.log(`    isFeatured=${e.isFeatured} isArchived=${e.isArchived}`);
  const trans = allTrans.filter(t => t.eventId === e.id);
  for (const tr of trans) {
    console.log(`    [${tr.language}] title="${tr.title}" summary="${(tr.summary||"").slice(0,60)}" status=${tr.status}`);
  }
}

process.exit(0);
