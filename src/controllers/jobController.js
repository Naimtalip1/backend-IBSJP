const pool = require('../config/database.js');

/**
 * Get all jobs
 */
const getAllJobs = async (req, res) => {
  try {
    console.log('Fetching all jobs');
    
    const result = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
    
    console.log(`✓ Retrieved ${result.rows.length} jobs`);
    res.json(result.rows);
  } catch (err) {
    console.error('✗ Error fetching jobs:', err.message);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

/**
 * Create a new job
 */
const createJob = async (req, res) => {
  const { title, company, description, location, salary_min, salary_max, salary_currency, job_type, experience_level, requirements, benefits } = req.body;
  
  try {
    console.log('Creating job:', { title, company, user_id: req.user.id });
    
    // Try with all fields first
    let result;
    try {
      result = await pool.query(
        `INSERT INTO jobs (title, company, description, location, salary_min, salary_max, salary_currency, job_type, experience_level, requirements, benefits, user_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
         RETURNING *`, 
        [title, company, description, location, salary_min || null, salary_max || null, salary_currency || 'MYR', job_type, experience_level, requirements, benefits, req.user.id]
      );
    } catch (columnErr) {
      // Fallback to basic fields if new columns don't exist
      if (columnErr.message.includes('does not exist')) {
        console.log('⚠️ Using basic job fields (extended columns not available)');
        result = await pool.query(
          `INSERT INTO jobs (title, company, description, user_id) 
           VALUES ($1, $2, $3, $4) 
           RETURNING *`, 
          [title, company, description, req.user.id]
        );
      } else {
        throw columnErr;
      }
    }
    
    console.log('✓ Job created:', result.rows[0].id);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('✗ Error creating job:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: 'Failed to create job', details: err.message });
  }
};

/**
 * Update a job
 */
const updateJob = async (req, res) => {
  const { id } = req.params;
  const { title, company, description, location, salary_min, salary_max, salary_currency, job_type, experience_level, requirements, benefits } = req.body;
  
  try {
    console.log('Updating job:', { id, title, user_id: req.user.id });
    
    // Try with all fields first
    let result;
    try {
      result = await pool.query(
        `UPDATE jobs 
         SET title = $1, company = $2, description = $3, location = $4, salary_min = $5, salary_max = $6, 
             salary_currency = $7, job_type = $8, experience_level = $9, requirements = $10, benefits = $11,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $12 AND user_id = $13 
         RETURNING *`,
        [title, company, description, location, salary_min || null, salary_max || null, salary_currency || 'MYR', job_type, experience_level, requirements, benefits, id, req.user.id]
      );
    } catch (columnErr) {
      // Fallback to basic fields if new columns don't exist
      if (columnErr.message.includes('does not exist')) {
        console.log('⚠️ Using basic job fields (extended columns not available)');
        result = await pool.query(
          `UPDATE jobs 
           SET title = $1, company = $2, description = $3
           WHERE id = $4 AND user_id = $5 
           RETURNING *`,
          [title, company, description, id, req.user.id]
        );
      } else {
        throw columnErr;
      }
    }
    
    if (result.rows.length === 0) {
      console.log('✗ Job not found or unauthorized:', { id, user_id: req.user.id });
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }
    
    console.log('✓ Job updated:', id);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('✗ Error updating job:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: 'Failed to update job', details: err.message });
  }
};

/**
 * Delete a job
 */
const deleteJob = async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log('Deleting job:', { id, user_id: req.user.id });
    
    // First delete related job applications to avoid foreign key constraint
    await pool.query('DELETE FROM job_applications WHERE job_id = $1', [id]);
    console.log('✓ Deleted related job applications for job:', id);
    
    // Then delete the job
    const result = await pool.query(
      'DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING *', 
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      console.log('✗ Job not found or unauthorized:', { id, user_id: req.user.id });
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }
    
    console.log('✓ Job deleted:', id);
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error('✗ Error deleting job:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ error: 'Failed to delete job', details: err.message });
  }
};

module.exports = {
  getAllJobs,
  createJob,
  updateJob,
  deleteJob
};
