import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'ep-divine-tree-a58e92ab-pooler.us-east-2.aws.neon.tech',
    user: 'neondb_owner',
    password: 'npg_pImOhPb58Wcw',
    database: 'neondb',
    ssl: 'require',
  },
} satisfies Config; 