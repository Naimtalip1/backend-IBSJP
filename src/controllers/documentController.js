const pool = require('../config/database.js');

/**
 * Upload user documents
 */
const uploadDocuments = async (req, res) => {
  try {
    // Delete existing documents for user
    await pool.query('DELETE FROM user_documents WHERE user_id = $1', [req.user.id]);
    
    const insertPromises = [];
    
    // Process uploaded files
    Object.keys(req.files).forEach(fieldName => {
      const files = req.files[fieldName];
      files.forEach(file => {
        insertPromises.push(
          pool.query(
            'INSERT INTO user_documents (user_id, document_type, file_name, file_path) VALUES ($1, $2, $3, $4)',
            [req.user.id, fieldName, file.originalname, `/uploads/${file.filename}`]
          )
        );
      });
    });
    
    await Promise.all(insertPromises);
    
    res.json({ 
      message: 'Documents uploaded successfully',
      files: req.files 
    });
  } catch (err) {
    console.error('Error uploading documents:', err);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
};

/**
 * Get user documents
 */
const getUserDocuments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_documents WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

module.exports = {
  uploadDocuments,
  getUserDocuments
};
