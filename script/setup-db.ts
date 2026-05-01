import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env file");
    process.exit(1);
  }

  console.log("🔄 Connecting to database...");
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  try {
    // Test connection
    await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully!");

    // Create a test super admin user
    console.log("\n🔄 Creating super admin user...");
    
    // First, create a user with username, email, and password
    const [user] = await db
      .insert(schema.users)
      .values({
        username: "vigyat",
        email: "vigyat@blackai.in",
        password: "vigyat@123", // In production, hash with bcrypt
        firstName: "Vigyat",
        lastName: "Admin",
      })
      .onConflictDoUpdate({
        target: schema.users.email,
        set: {
          username: "vigyat",
          password: "vigyat@123",
          firstName: "Vigyat",
          lastName: "Admin",
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log(`✅ User created: ${user.username} / ${user.email} (ID: ${user.id})`);

    // Then create admin record
    const [admin] = await db
      .insert(schema.admins)
      .values({
        userId: user.id,
        role: "super_admin",
        isActive: true,
      })
      .onConflictDoNothing()
      .returning();

    if (admin) {
      console.log(`✅ Super admin created with role: ${admin.role}`);
    } else {
      console.log("ℹ️  Admin already exists for this user");
    }

    console.log("\n✅ Database setup complete!");
    console.log("\n📝 Login Credentials:");
    console.log("Username: vigyat");
    console.log("Email: vigyat@blackai.in");
    console.log("Password: vigyat@123");
    console.log("\nYou can login with either username or email!");

  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
