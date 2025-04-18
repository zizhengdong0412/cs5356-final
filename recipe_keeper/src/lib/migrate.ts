import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import bcrypt from 'bcryptjs';

const isDevelopment = process.env.NODE_ENV !== 'production';

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
    // Enable UUID extension
    await connection`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    // In development mode, we can reset the database
    if (isDevelopment) {
      const shouldReset = process.argv.includes('--reset');
      
      if (shouldReset) {
        console.log("⚠️ DEVELOPMENT MODE: Dropping existing tables...");
        await connection`DROP TABLE IF EXISTS recipes CASCADE`;
        await connection`DROP TABLE IF EXISTS sessions CASCADE`;
        await connection`DROP TABLE IF EXISTS users CASCADE`;
      }
    } else {
      console.log("PRODUCTION MODE: Not dropping any tables for safety");
    }
    
    console.log("Creating tables if they don't exist...");
    
    // Create users table
    await connection`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        password TEXT NOT NULL,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `;
    
    // Create sessions table
    await connection`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `;
    
    // Create recipes table
    await connection`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        cooking_time INTEGER,
        servings INTEGER,
        type TEXT NOT NULL,
        thumbnail TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `;
    
    // Only create test account in development mode
    if (isDevelopment) {
      console.log("Creating test account for development...");
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      await db.insert(schema.users).values({
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User",
        emailVerified: true
      }).onConflictDoNothing();
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

// If this script is run directly
if (require.main === module) {
  main().catch((err) => {
    console.error("Migration script failed:", err);
    process.exit(1);
  });
}

// Export the migration function for programmatic use
export default main; 