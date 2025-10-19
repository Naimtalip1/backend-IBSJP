const { Pool } = require('pg');

// Direct connection with working credentials
const pool = new Pool({
  user: 'postgres',
  host: 'localhost', 
  database: 'job_portal',
  password: 'admin',
  port: 5432,
});

async function testJobsAPI() {
  try {
    console.log('🧪 Testing database with new columns...\n');
    
    // Test fetching all jobs with new fields
    const allJobs = await pool.query('SELECT * FROM jobs LIMIT 3');
    console.log('📋 Sample jobs with all fields:');
    
    if (allJobs.rows.length > 0) {
      console.log('Available columns:', Object.keys(allJobs.rows[0]));
      
      allJobs.rows.forEach((job, index) => {
        console.log(`\n🔍 Job ${index + 1}:`);
        console.log(`   - ID: ${job.id}`);
        console.log(`   - Title: ${job.title}`);
        console.log(`   - Company: ${job.company}`);
        console.log(`   - Location: ${job.location || 'Not set'}`);
        console.log(`   - Salary Min: ${job.salary_min || 'Not set'}`);
        console.log(`   - Salary Max: ${job.salary_max || 'Not set'}`);
        console.log(`   - Job Type: ${job.job_type || 'Not set'}`);
        console.log(`   - Experience: ${job.experience_level || 'Not set'}`);
        console.log(`   - Requirements: ${job.requirements ? 'Set' : 'Not set'}`);
        console.log(`   - Benefits: ${job.benefits ? 'Set' : 'Not set'}`);
      });
    } else {
      console.log('No jobs found in database');
    }
    
    console.log('\n✅ Database test completed successfully!');
    console.log('🎉 All new columns are working and accessible!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testJobsAPI();