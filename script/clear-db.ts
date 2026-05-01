import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

async function clearDb() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query("SELECT NOW()");
    console.log("✅ Connected");

    await pool.query(`
      TRUNCATE TABLE
        event_registrations,
        event_translations,
        events,
        project_translations,
        projects,
        donations,
        youtube_videos
      RESTART IDENTITY CASCADE
    `);

    console.log("✅ All content data cleared (admins & users preserved)");
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearDb();
