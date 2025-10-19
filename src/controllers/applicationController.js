const pool = require('../config/database.js');
const constants = require('../constants.js');

/**
 * Submit a job application
 */
const submitApplication = async (req, res) => {
  const { jobId } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO job_applications (user_id, job_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [req.user.id, jobId, constants.APPLICATION_STATUSES.PENDING]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating job application:', err);
    res.status(500).json({ error: 'Failed to create job application' });
  }
};

/**
 * Get applications for current user
 */
const getUserApplications = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ja.*, j.title, j.company, j.description 
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.user_id = $1
      ORDER BY ja.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching job applications:', err);
    res.status(500).json({ error: 'Failed to fetch job applications' });
  }
};

/**
 * Get all applications (admin only)
 */
const getAllApplications = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ja.*,
        u.email as user_email,
        pi.full_name,
        j.title as job_title,
        j.company
      FROM job_applications ja
      JOIN users u ON ja.user_id = u.id
      LEFT JOIN personal_info pi ON ja.user_id = pi.user_id
      JOIN jobs j ON ja.job_id = j.id
      ORDER BY ja.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

/**
 * Update application status (admin only)
 */
const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE job_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating application status:', err);
    res.status(500).json({ error: 'Failed to update application status' });
  }
};

module.exports = {
  submitApplication,
  getUserApplications,
  getAllApplications,
  updateApplicationStatus
};
