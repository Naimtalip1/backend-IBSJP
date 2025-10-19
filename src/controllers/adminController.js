const pool = require('../config/database.js');
const constants = require('../constants.js');

/**
 * Get all users with their statistics (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at,
        pi.full_name,
        pi.contact_number,
        pi.preferred_position,
        COUNT(ja.id) as applications_count,
        MAX(ja.created_at) as last_application
      FROM users u
      LEFT JOIN personal_info pi ON u.id = pi.user_id
      LEFT JOIN job_applications ja ON u.id = ja.user_id
      WHERE u.role != '${constants.ROLES.ADMIN}'
      GROUP BY u.id, u.email, u.role, u.created_at, pi.full_name, pi.contact_number, pi.preferred_position
      ORDER BY u.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

module.exports = {
  getAllUsers
};
