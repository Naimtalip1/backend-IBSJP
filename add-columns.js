const { Pool } = require('pg');

// Direct connection with correct credentials
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'job_portal',
  password: 'admin',
  port: 5432,
});

async function addColumns() {
  try {
    console.log('🔧 Adding missing columns to jobs table...\n');
    
    const columns = [
      { name: 'location', sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location VARCHAR(255)' },
      { name: 'salary_min', sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_min DECIMAL(10,2)' },
      { name: 'salary_max', sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_max DECIMAL(10,2)' },
      { name: 'salary_currency', sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT \'MYR\'' },
      { name: 'job_type', sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type VARCHAR(50)' },
      { name: 'experience_level', sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50)' },
      { name: 'requirements', sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT' },
      { name: 'benefits', sql: 'ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT' }
    ];
    
    for (const column of columns) {
      try {
        await pool.query(column.sql);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️ Column ${column.name} already exists`);
        } else {
          console.error(`❌ Error adding ${column.name}:`, error.message);
        }
      }
    }
    
    console.log('\n🔍 Verifying updated table structure...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Final table structure:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n✅ Database update completed!');
    console.log('🎉 Your job management system should now work with all features!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

addColumns();