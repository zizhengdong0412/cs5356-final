import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/database/db"
import * as schema from "@/database/schema"
import { nextCookies } from "better-auth/next-js"

export const auth = betterAuth({
    baseUrl: process.env.BETTER_AUTH_URL!,

    database: drizzleAdapter(db, {
        provider: "pg",
        usePlural: true,
        schema
    }),

    user: {
        additionalFields: {
          role: { type: "string" }  
        }
      },
    session: {
        cookieCache: {
            enabled: true,
            // Cache duration in seconds.
            // set to 5 mins for development; 
            // could be a week or longer in production
            maxAge: 5 * 60 
        }
    },
    emailAndPassword: {
        enabled: true
    },
    plugins: [
        nextCookies() // keep this last in `plugins` array
    ]
})

