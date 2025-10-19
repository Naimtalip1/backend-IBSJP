const express = require('express');
const skillsController = require('../controllers/skillsController.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

/**
 * Skills Routes
 */
router.post('/skills', authenticateToken, skillsController.saveSkills);
router.get('/skills', authenticateToken, skillsController.getSkills);

/**
 * References Routes
 */
router.post('/references', authenticateToken, skillsController.saveReferences);
router.get('/references', authenticateToken, skillsController.getReferences);

/**
 * Declaration Routes
 */
router.post('/declaration', authenticateToken, skillsController.saveDeclaration);
router.get('/declaration', authenticateToken, skillsController.getDeclaration);

module.exports = router;
