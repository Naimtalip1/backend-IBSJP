const pool = require('../config/database.js');

/**
 * Save or update personal info
 */
const savePersonalInfo = async (req, res) => {
  const { personalInfo } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO personal_info (
        user_id, full_name, identification_number, date_of_birth, gender, 
        nationality, race, marital_status, contact_number, current_address, 
        permanent_address, same_as_current_address, expected_salary, preferred_position
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        identification_number = EXCLUDED.identification_number,
        date_of_birth = EXCLUDED.date_of_birth,
        gender = EXCLUDED.gender,
        nationality = EXCLUDED.nationality,
        race = EXCLUDED.race,
        marital_status = EXCLUDED.marital_status,
        contact_number = EXCLUDED.contact_number,
        current_address = EXCLUDED.current_address,
        permanent_address = EXCLUDED.permanent_address,
        same_as_current_address = EXCLUDED.same_as_current_address,
        expected_salary = EXCLUDED.expected_salary,
        preferred_position = EXCLUDED.preferred_position,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      req.user.id, personalInfo.fullName, personalInfo.identificationNumber,
      personalInfo.dateOfBirth, personalInfo.gender, personalInfo.nationality,
      personalInfo.race, personalInfo.maritalStatus, personalInfo.contactNumber,
      personalInfo.currentAddress, personalInfo.permanentAddress,
      personalInfo.sameAsCurrentAddress, personalInfo.expectedSalary, personalInfo.preferredPosition
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving personal info:', err);
    res.status(500).json({ error: 'Failed to save personal info' });
  }
};

/**
 * Get personal info for current user
 */
const getPersonalInfo = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personal_info WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error fetching personal info:', err);
    res.status(500).json({ error: 'Failed to fetch personal info' });
  }
};

/**
 * Save or update education
 */
const saveEducation = async (req, res) => {
  const { education } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO education (
        user_id, highest_qualification, field_of_study, institution, 
        year_graduated, cgpa, additional_certifications
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        highest_qualification = EXCLUDED.highest_qualification,
        field_of_study = EXCLUDED.field_of_study,
        institution = EXCLUDED.institution,
        year_graduated = EXCLUDED.year_graduated,
        cgpa = EXCLUDED.cgpa,
        additional_certifications = EXCLUDED.additional_certifications,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      req.user.id, education.highestQualification, education.fieldOfStudy,
      education.institution, education.yearGraduated, education.cgpa,
      education.additionalCertifications
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving education:', err);
    res.status(500).json({ error: 'Failed to save education' });
  }
};

/**
 * Get education for current user
 */
const getEducation = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM education WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error fetching education:', err);
    res.status(500).json({ error: 'Failed to fetch education' });
  }
};

/**
 * Save or update employment history
 */
const saveEmploymentHistory = async (req, res) => {
  const { employmentHistory } = req.body;
  try {
    // Delete existing employment history for user
    await pool.query('DELETE FROM employment_history WHERE user_id = $1', [req.user.id]);
    
    // Insert new employment history
    const insertPromises = employmentHistory.map(employment => {
      return pool.query(`
        INSERT INTO employment_history (
          user_id, company_name, position, start_date, end_date, 
          is_currently_working, key_responsibilities, reason_for_leaving,
          reference_name, reference_position, reference_contact
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        req.user.id, employment.companyName, employment.position,
        employment.startDate, employment.endDate, employment.isCurrentlyWorking,
        employment.keyResponsibilities, employment.reasonForLeaving,
        employment.referencePerson.name, employment.referencePerson.position,
        employment.referencePerson.contact
      ]);
    });
    
    const results = await Promise.all(insertPromises);
    res.json(results.map(r => r.rows[0]));
  } catch (err) {
    console.error('Error saving employment history:', err);
    res.status(500).json({ error: 'Failed to save employment history' });
  }
};

/**
 * Get employment history for current user
 */
const getEmploymentHistory = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employment_history WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching employment history:', err);
    res.status(500).json({ error: 'Failed to fetch employment history' });
  }
};

/**
 * Get complete user profile
 */
const getCompleteProfile = async (req, res) => {
  try {
    const personalInfo = await pool.query('SELECT * FROM personal_info WHERE user_id = $1', [req.user.id]);
    const education = await pool.query('SELECT * FROM education WHERE user_id = $1', [req.user.id]);
    const employmentHistory = await pool.query('SELECT * FROM employment_history WHERE user_id = $1', [req.user.id]);
    const skills = await pool.query('SELECT * FROM user_skills WHERE user_id = $1', [req.user.id]);
    const languages = await pool.query('SELECT * FROM user_languages WHERE user_id = $1', [req.user.id]);
    const references = await pool.query('SELECT * FROM user_references WHERE user_id = $1', [req.user.id]);
    const declaration = await pool.query('SELECT * FROM declarations WHERE user_id = $1', [req.user.id]);

    res.json({
      personalInfo: personalInfo.rows[0] || {},
      education: education.rows[0] || {},
      employmentHistory: employmentHistory.rows,
      skills: {
        ...skills.rows[0] || {},
        languages: languages.rows
      },
      references: references.rows,
      declaration: declaration.rows[0] || {}
    });
  } catch (err) {
    console.error('Error fetching complete profile:', err);
    res.status(500).json({ error: 'Failed to fetch complete profile' });
  }
};

/**
 * Get any user's complete profile (admin only)
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const personalInfo = await pool.query('SELECT * FROM personal_info WHERE user_id = $1', [userId]);
    const education = await pool.query('SELECT * FROM education WHERE user_id = $1', [userId]);
    const employmentHistory = await pool.query('SELECT * FROM employment_history WHERE user_id = $1', [userId]);
    const skills = await pool.query('SELECT * FROM user_skills WHERE user_id = $1', [userId]);
    const languages = await pool.query('SELECT * FROM user_languages WHERE user_id = $1', [userId]);
    const references = await pool.query('SELECT * FROM user_references WHERE user_id = $1', [userId]);
    const declaration = await pool.query('SELECT * FROM declarations WHERE user_id = $1', [userId]);
    const documents = await pool.query('SELECT * FROM user_documents WHERE user_id = $1', [userId]);

    res.json({
      personalInfo: personalInfo.rows[0] || {},
      education: education.rows[0] || {},
      employmentHistory: employmentHistory.rows,
      skills: {
        ...skills.rows[0] || {},
        languages: languages.rows
      },
      references: references.rows,
      declaration: declaration.rows[0] || {},
      documents: documents.rows
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

module.exports = {
  savePersonalInfo,
  getPersonalInfo,
  saveEducation,
  getEducation,
  saveEmploymentHistory,
  getEmploymentHistory,
  getCompleteProfile,
  getUserProfile
};
