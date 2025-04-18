import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use the unpooled connection for drizzle adapter
const connectionString = process.env.DATABASE_URL_UNPOOLED!;

// Create the connection
const client = postgres(connectionString);

// Create the db instance with schema
export const db = drizzle(client, { schema }); 