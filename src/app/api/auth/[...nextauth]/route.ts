import NextAuth from "next-auth";
import { authOptions } from '@/lib/auth';

// Create the handler directly in the route file
const handler = NextAuth(authOptions);

// Export the handlers
export const { GET, POST } = handler;