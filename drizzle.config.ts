// drizzle.config.ts  ── 位于项目根目录
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/schema/**/*.ts',
  out:    './drizzle/migrations',

  dialect: 'postgresql',        // 必填

  dbCredentials: {
    url: process.env.DATABASE_URL!,   // 直接用 Neon 的完整 URL
    // 也可拆成 host / user / password / database
  },
});