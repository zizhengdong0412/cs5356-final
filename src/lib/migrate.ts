import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/schema';
import { users } from '@/schema/users';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { sql } from 'drizzle-orm';

const isDevelopment = process.env.NODE_ENV !== 'production';

async function main() {
  console.log("🚀 Running migration script...");

  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("❌ DATABASE_URL_UNPOOLED is not set.");
  }

  const connection = postgres(connectionString, { max: 1 });
  const db = drizzle(connection, { schema });

  try {
    // Enable UUID extension
    await connection`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    if (isDevelopment && process.argv.includes('--reset')) {
      console.log("⚠️ DEVELOPMENT RESET: Dropping tables...");
      await connection`DROP TABLE IF EXISTS recipe_shares CASCADE`;
      await connection`DROP TABLE IF EXISTS recipes CASCADE`;
      await connection`DROP TABLE IF EXISTS binder_shares CASCADE`;
      await connection`DROP TABLE IF EXISTS recipe_binders CASCADE`;
      await connection`DROP TABLE IF EXISTS verification_tokens CASCADE`;
      await connection`DROP TABLE IF EXISTS sessions CASCADE`;
      await connection`DROP TABLE IF EXISTS accounts CASCADE`;
      await connection`DROP TABLE IF EXISTS users CASCADE`;
    }

    // Let drizzle handle the schema creation
    console.log("📦 Drizzle will handle table creation based on schema definitions");

    // Seed test user
    if (isDevelopment) {
      console.log("🌱 Inserting test user...");
      const hashedPassword = await bcrypt.hash('testpass123', 10);

      await db.insert(users).values({
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        email_verified: false,
        created_at: new Date(),
        updated_at: new Date(),
      }).onConflictDoNothing();
    }

    // Add the type column to the recipes table if it doesn't exist
    console.log('Adding type column to recipes table if it doesn\'t exist...');
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'recipes' 
          AND column_name = 'type'
        ) THEN 
          ALTER TABLE recipes 
          ADD COLUMN type TEXT NOT NULL DEFAULT 'personal';
        END IF;
      END $$;
    `);

    console.log("✅ Migration complete.");
  } catch (err) {
    console.error("❌ Migration error:", err);
    throw err;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("🚨 Migration script failed:", err);
    process.exit(1);
  });
}

export default main;
