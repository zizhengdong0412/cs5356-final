import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Use the unpooled connection for drizzle adapter
let connectionString = process.env.DATABASE_URL_UNPOOLED || '';

// Clean up any whitespace or line breaks in the connection string
connectionString = connectionString.replace(/\s+/g, '');

// Add debug logging
console.log("Database connection string available:", !!connectionString);
console.log("Connection string prefix:", connectionString?.substring(0, 20) + "...");

// Create the connection
let db: PostgresJsDatabase<typeof schema>;
try {
  const client = postgres(connectionString);
  
  // Create the db instance with schema
  db = drizzle(client, { schema });
  console.log("Database connection successful!");
} catch (error) {
  console.error("Database connection error:", error);
  throw error;
}

export { db }; 