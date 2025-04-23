import { db } from './db';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

/**
 * This utility helps diagnose database schema issues and can fix them if needed
 */

export async function checkSchema() {
  const results: Record<string, any> = {};
  
  try {
    // Check if 'users' table exists
    results.usersTable = await checkTable('users');
    
    // Check if 'sessions' table exists
    results.sessionsTable = await checkTable('sessions');
    
    // Check for any indexes
    results.indexes = await getIndexes();
    
    return results;
  } catch (error) {
    console.error('Error checking schema:', error);
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function checkTable(tableName: string) {
  try {
    // Check if table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      );
    `);
    
    if (!tableExists[0]?.exists) {
      return {
        exists: false,
        columns: []
      };
    }
    
    // Get column information
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      ORDER BY ordinal_position;
    `);
    
    return {
      exists: true,
      columns: columns
    };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function getIndexes() {
  try {
    const indexes = await db.execute(sql`
      SELECT
        t.relname AS table_name,
        i.relname AS index_name,
        a.attname AS column_name
      FROM
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a
      WHERE
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname IN ('users', 'sessions')
      ORDER BY
        t.relname,
        i.relname;
    `);
    
    return indexes;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function fixSchemaIfNeeded() {
  const schema = await checkSchema();
  const fixes: string[] = [];
  
  // Check if users table exists
  if (!schema.usersTable?.exists) {
    fixes.push('Users table missing - requires manual migration');
  }
  
  // Check if sessions table exists
  if (!schema.sessionsTable?.exists) {
    fixes.push('Sessions table missing - requires manual migration');
  }
  
  // Check for session expiry index
  const hasExpiryIndex = schema.indexes?.some((idx: any) => 
    idx.table_name === 'sessions' && 
    idx.column_name === 'expires_at'
  );
  
  if (!hasExpiryIndex && schema.sessionsTable?.exists) {
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
      `);
      fixes.push('Created missing index on sessions.expires_at');
    } catch (error) {
      fixes.push(`Failed to create index: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return {
    schemaCheck: schema,
    fixes,
    fixesApplied: fixes.length > 0
  };
} 