const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'job_portal',
  password: 'admin',
  port: 5432,
});

async function checkColumns() {
  try {
    console.log('🔍 Checking current database structure...\n');
    
    // Check table columns
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current columns in jobs table:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if we have any jobs
    const jobCount = await pool.query('SELECT COUNT(*) FROM jobs');
    console.log(`\n📊 Total jobs in database: ${jobCount.rows[0].count}`);
    
    // Sample job data
    const jobData = await pool.query('SELECT * FROM jobs LIMIT 1');
    if (jobData.rows[0]) {
      console.log('\n🔍 Available data columns:', Object.keys(jobData.rows[0]));
      console.log('\n📄 Sample job data:');
      Object.entries(jobData.rows[0]).forEach(([key, value]) => {
        console.log(`   ${key}: ${value === null ? 'NULL' : value}`);
      });
    }
    
    // Check which columns are missing
    const requiredColumns = ['location', 'salary_min', 'salary_max', 'salary_currency', 'job_type', 'experience_level', 'requirements', 'benefits'];
    const existingColumns = result.rows.map(row => row.column_name);
    
    console.log('\n❌ Missing columns:');
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    if (missingColumns.length === 0) {
      console.log('   ✅ All required columns exist!');
    } else {
      missingColumns.forEach(col => console.log(`   - ${col}`));
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    process.exit(1);
  }
}

checkColumns();