import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { appUsers } from '@/schema';
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
  const db = drizzle(connection);

  try {
    // Enable UUID extension
    await connection`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    if (isDevelopment && process.argv.includes('--reset')) {
      console.log("⚠️ DEVELOPMENT RESET: Dropping tables...");
      // Drop all tables in reverse order of dependencies
      await connection`DROP TABLE IF EXISTS shared_recipes CASCADE`;
      await connection`DROP TABLE IF EXISTS recipes CASCADE`;
      await connection`DROP TABLE IF EXISTS verification_tokens CASCADE`;
      await connection`DROP TABLE IF EXISTS sessions CASCADE`;
      await connection`DROP TABLE IF EXISTS accounts CASCADE`;
      await connection`DROP TABLE IF EXISTS users CASCADE`;
    }

    // Create tables
    console.log("📦 Creating tables...");
    
    // Create users table
    await connection`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        password TEXT,
        image TEXT,
        email_verified TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create sessions table
    await connection`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        expires_at TIMESTAMP NOT NULL
      )
    `;

    // Create accounts table
    await connection`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        userId UUID NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        providerAccountId TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at TIMESTAMP,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT
      )
    `;

    // Create verification_tokens table
    await connection`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      )
    `;

    // Create recipes table
    await connection`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        cooking_time INTEGER,
        servings INTEGER,
        type TEXT NOT NULL DEFAULT 'personal',
        thumbnail TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create shared_recipes table
    await connection`
      CREATE TABLE IF NOT EXISTS shared_recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id),
        owner_id UUID NOT NULL REFERENCES users(id),
        shared_with_id UUID REFERENCES users(id),
        permission TEXT NOT NULL DEFAULT 'view',
        share_code TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Seed test user
    if (isDevelopment) {
      console.log("🌱 Inserting test user...");
      const hashedPassword = await bcrypt.hash('testpass123', 10);

      await db.insert(appUsers).values({
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "test@example.com",
        name: "Test User",
        password: hashedPassword,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoNothing();
    }

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
