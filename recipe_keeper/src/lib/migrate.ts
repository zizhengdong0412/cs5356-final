import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

// For migrations
async function main() {
  console.log("Running migrations...");
  
  const connectionString = process.env.DATABASE_URL_UNPOOLED;
  console.log("Using connection string:", connectionString);
  
  if (!connectionString) {
    throw new Error("DATABASE_URL_UNPOOLED environment variable is not set");
  }
  
  const connection = postgres(connectionString, { max: 1 });
  const db = drizzle(connection, { schema });

  try {
    console.log("Creating database schema...");
    
    // Create users table if it doesn't exist
    await connection`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        password TEXT NOT NULL,
        email_verified TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Create sessions table if it doesn't exist
    await connection`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    console.log("Tables created successfully!");
    
    console.log("Adding test user...");
    // Insert a test user
    await db.insert(schema.users).values({
      id: crypto.randomUUID(),
      email: "test@example.com",
      password: "$2a$12$qr1FjPLyQYx4m7fgdD7iKO0s29zLLGHSJtGDG8IbHFn4BxhAZGW/W", // password is "password123"
      name: "Test User",
      createdAt: new Date(),
      updatedAt: new Date()
    }).onConflictDoNothing();
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
}); 