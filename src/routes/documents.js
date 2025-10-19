const express = require('express');
const documentController = require('../controllers/documentController.js');
const { authenticateToken } = require('../middleware/auth.js');
const upload = require('../config/multer.js');

const router = express.Router();

/**
 * Document Upload Routes
 */
router.post('/upload', authenticateToken, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 },
  { name: 'academicCertificates', maxCount: 10 },
  { name: 'idCopy', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 }
]), documentController.uploadDocuments);

/**
 * Get User Documents Route
 */
router.get('/', authenticateToken, documentController.getUserDocuments);

module.exports = router;
