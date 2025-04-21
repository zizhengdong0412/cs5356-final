// add-type-column.js
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function main() {
  console.log('Starting database migration...');
  
  // Create a connection to the database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connected to database:', process.env.DATABASE_URL);
    
    // Add the type column to the recipes table if it doesn't exist
    console.log('Adding type column to recipes table...');
    
    // Check if the column exists
    const checkColumnResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'recipes' 
      AND column_name = 'type'
    `);
    
    if (checkColumnResult.rows.length === 0) {
      console.log('Type column does not exist. Adding it now...');
      
      // Add the column
      await pool.query(`
        ALTER TABLE recipes 
        ADD COLUMN type TEXT NOT NULL DEFAULT 'personal'
      `);
      
      console.log('Type column added successfully!');
    } else {
      console.log('Type column already exists.');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main(); 