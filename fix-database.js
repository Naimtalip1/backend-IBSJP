const pool = require('./src/config/database.js');

(async () => {
  try {
    console.log('=== CHECKING JOBS TABLE STRUCTURE ===');
    
    // Check current columns
    const cols = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current columns:');
    cols.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n=== ADDING MISSING COLUMNS ===');
    
    // Add missing columns one by one
    const columnsToAdd = [
      'location VARCHAR(255)',
      'salary_min DECIMAL(10, 2)',
      'salary_max DECIMAL(10, 2)', 
      'salary_currency VARCHAR(10) DEFAULT \'MYR\'',
      'job_type VARCHAR(50)',
      'experience_level VARCHAR(50)',
      'requirements TEXT',
      'benefits TEXT',
      'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    ];
    
    for (const column of columnsToAdd) {
      try {
        const columnName = column.split(' ')[0];
        await pool.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ${column}`);
        console.log(`✓ Added column: ${columnName}`);
      } catch (err) {
        console.log(`- Column might exist: ${column.split(' ')[0]} (${err.message})`);
      }
    }
    
    console.log('\n=== FINAL TABLE STRUCTURE ===');
    const finalCols = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      ORDER BY ordinal_position
    `);
    
    finalCols.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();