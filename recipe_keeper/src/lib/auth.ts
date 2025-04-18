import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { users, sessions } from './schema';

// Get the table name for debugging
console.log("Initializing auth with table names - users:", 'users', "sessions:", 'sessions');

// Initialize the auth client with server-side configuration
export const auth = betterAuth({
  adapter: drizzleAdapter(db, {
    schema: {
      user: users,
      session: sessions,
    },
    provider: 'pg',
  }),
  usePlural: true,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
}); 