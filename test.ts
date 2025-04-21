// test.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("DATABASE_URL_UNPOOLED:", process.env.DATABASE_URL_UNPOOLED);
