import NextAuth from "next-auth";
import { DefaultSession, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Extend session type to include user ID
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

interface DbUserResult {
  id: string | number;
  email: string | null;
  name?: string | null;
  image?: string | null;
  password?: string | null;
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV === "development";

export const authOptions = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  pages: {
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-out",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const userResults = await db.execute(sql`
          SELECT * FROM users WHERE email = ${credentials.email} LIMIT 1
        `);

        if (!userResults[0]) return null;

        const userData = userResults[0] as unknown as DbUserResult;
        const hashedPassword =
          typeof userData.password === "string"
            ? userData.password
            : userData.password
            ? String(userData.password)
            : "";

        const isValid = await bcrypt.compare(credentials.password, hashedPassword);
        if (!isValid) return null;

        return {
          id: String(userData.id),
          email: String(userData.email),
          name: userData.name || null,
          image: userData.image || null,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST!,
        port: Number(process.env.EMAIL_SERVER_PORT!),
        auth: {
          user: process.env.EMAIL_SERVER_USER!,
          pass: process.env.EMAIL_SERVER_PASSWORD!,
        },
      },
      from: process.env.EMAIL_FROM!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: { user?: { id?: string } } & DefaultSession;
      token: JWT;
    }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  debug: isDev,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

export async function getAuthSession() {
  if (typeof auth === 'function') {
    return await auth();
  } else {
    const session = await fetch('/api/client-auth/session', {
      credentials: 'include',
    }).then(res => res.json())
      .catch(err => {
        console.error('Error fetching session:', err);
        return { user: null };
      });
      
    return session;
  }
}

export async function isAuthenticated() {
  const session = await getAuthSession();
  return !!session?.user;
}

export async function SignInUser(email: string, password: string) {
  try {
    const userResults = await db.execute(sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `);

    if (!userResults[0]) return null;

    const userData = userResults[0] as unknown as DbUserResult;
    const hashedPassword =
      typeof userData.password === "string"
        ? userData.password
        : userData.password
        ? String(userData.password)
        : "";

    const isValid = await bcrypt.compare(password, hashedPassword);
    if (!isValid) return null;

    return {
      id: String(userData.id),
      email: String(userData.email),
      name: userData.name || null,
      image: userData.image || null,
    };
  } catch (error) {
    console.error("SignInUser error:", error);
    return null;
  }
}

export async function SignUpUser(email: string, password: string, name?: string) {
  try {
    const existingUser = await db.execute(sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `);

    if (existingUser[0]) return null;

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await db.execute(sql`
      INSERT INTO users (id, email, name, password)
      VALUES (${userId}, ${email}, ${name || null}, ${hashedPassword})
    `);

    return {
      id: userId,
      email,
      name: name || null,
      image: null,
    };
  } catch (error) {
    console.error("SignUpUser error:", error);
    return null;
  }
}
