import { createAuthClient } from 'better-auth/react';

export type Session = {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
};

export type User = Session['user'];

// Make sure we're using the environment variable
const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

console.log("Auth client using baseURL:", baseURL);

export const authClient = createAuthClient({
  baseURL: baseURL!,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
});

export const { signIn, signUp, signOut, getSession } = authClient; 