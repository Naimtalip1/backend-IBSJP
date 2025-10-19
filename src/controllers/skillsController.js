const pool = require('../config/database.js');

/**
 * Save or update skills and languages
 */
const saveSkills = async (req, res) => {
  const { skills } = req.body;
  try {
    // Save skills
    const skillsResult = await pool.query(`
      INSERT INTO user_skills (user_id, technical_skills, soft_skills, additional_competencies)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        technical_skills = EXCLUDED.technical_skills,
        soft_skills = EXCLUDED.soft_skills,
        additional_competencies = EXCLUDED.additional_competencies,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [req.user.id, skills.technicalSkills, skills.softSkills, skills.additionalCompetencies]);

    // Delete existing languages and insert new ones
    await pool.query('DELETE FROM user_languages WHERE user_id = $1', [req.user.id]);
    const languagePromises = skills.languages.map(lang => {
      return pool.query(
        'INSERT INTO user_languages (user_id, language, proficiency) VALUES ($1, $2, $3)',
        [req.user.id, lang.language, lang.proficiency]
      );
    });
    await Promise.all(languagePromises);

    res.json({ skills: skillsResult.rows[0], languages: skills.languages });
  } catch (err) {
    console.error('Error saving skills:', err);
    res.status(500).json({ error: 'Failed to save skills' });
  }
};

/**
 * Get skills and languages for current user
 */
const getSkills = async (req, res) => {
  try {
    const skillsResult = await pool.query('SELECT * FROM user_skills WHERE user_id = $1', [req.user.id]);
    const languagesResult = await pool.query('SELECT * FROM user_languages WHERE user_id = $1', [req.user.id]);
    
    res.json({
      skills: skillsResult.rows[0] || {},
      languages: languagesResult.rows
    });
  } catch (err) {
    console.error('Error fetching skills:', err);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
};

/**
 * Save or update references
 */
const saveReferences = async (req, res) => {
  const { references } = req.body;
  try {
    // Delete existing references
    await pool.query('DELETE FROM user_references WHERE user_id = $1', [req.user.id]);
    
    // Insert new references
    const insertPromises = references.map(ref => {
      return pool.query(`
        INSERT INTO user_references (user_id, name, relationship, company_position, contact_number, email)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [req.user.id, ref.name, ref.relationship, ref.companyPosition, ref.contactNumber, ref.email]);
    });
    
    const results = await Promise.all(insertPromises);
    res.json(results.map(r => r.rows[0]));
  } catch (err) {
    console.error('Error saving references:', err);
    res.status(500).json({ error: 'Failed to save references' });
  }
};

/**
 * Get references for current user
 */
const getReferences = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_references WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching references:', err);
    res.status(500).json({ error: 'Failed to fetch references' });
  }
};

/**
 * Save or update declaration
 */
const saveDeclaration = async (req, res) => {
  const { declaration } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO declarations (user_id, agree_to_terms, signature, declaration_date)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        agree_to_terms = EXCLUDED.agree_to_terms,
        signature = EXCLUDED.signature,
        declaration_date = EXCLUDED.declaration_date
      RETURNING *
    `, [req.user.id, declaration.agreeToTerms, declaration.signature, declaration.date]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving declaration:', err);
    res.status(500).json({ error: 'Failed to save declaration' });
  }
};

/**
 * Get declaration for current user
 */
const getDeclaration = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM declarations WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    console.error('Error fetching declaration:', err);
    res.status(500).json({ error: 'Failed to fetch declaration' });
  }
};

module.exports = {
  saveSkills,
  getSkills,
  saveReferences,
  getReferences,
  saveDeclaration,
  getDeclaration
};
