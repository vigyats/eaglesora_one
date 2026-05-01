import { db } from "../server/db.js";
import { youtubeVideos } from "../shared/schema.js";

const rows = await db.select().from(youtubeVideos);
console.log(JSON.stringify(rows, null, 2));
process.exit(0);
