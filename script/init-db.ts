import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env file");
    process.exit(1);
  }

  console.log("🔄 Connecting to database...");
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Create public schema if it doesn't exist
    console.log("🔄 Creating public schema...");
    await pool.query("CREATE SCHEMA IF NOT EXISTS public");
    console.log("✅ Public schema ready!");

    console.log("\n✅ Database initialized successfully!");
    console.log("\nNext steps:");
    console.log("1. Run: npm run db:push");
    console.log("2. Run: npm run db:setup");

  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
