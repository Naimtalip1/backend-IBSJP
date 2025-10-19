const pool = require('./src/config/database.js');

(async () => {
  try {
    // Check jobs table structure
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs'
      ORDER BY ordinal_position
    `);
    
    console.log('=== JOBS TABLE STRUCTURE ===');
    cols.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
    
    // Try to insert a test job
    console.log('\n=== TESTING INSERT ===');
    const result = await pool.query(`
      INSERT INTO jobs (title, company, description, location, salary_min, salary_max, salary_currency, job_type, experience_level, requirements, benefits, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, ['Test Job', 'Test Company', 'Test Description', 'Test Location', 5000, 8000, 'MYR', 'Full-time', 'Entry Level', 'Test Requirements', 'Test Benefits', 1]);
    
    console.log('✓ Insert successful');
    console.log('Job ID:', result.rows[0].id);
    
  } catch (err) {
    console.error('✗ Error:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
