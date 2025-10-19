const express = require('express');
const profileController = require('../controllers/profileController.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();

/**
 * Personal Info Routes
 */
router.post('/personal-info', authenticateToken, profileController.savePersonalInfo);
router.get('/personal-info', authenticateToken, profileController.getPersonalInfo);

/**
 * Education Routes
 */
router.post('/education', authenticateToken, profileController.saveEducation);
router.get('/education', authenticateToken, profileController.getEducation);

/**
 * Employment History Routes
 */
router.post('/employment-history', authenticateToken, profileController.saveEmploymentHistory);
router.get('/employment-history', authenticateToken, profileController.getEmploymentHistory);

/**
 * Complete Profile Routes
 */
router.get('/complete', authenticateToken, profileController.getCompleteProfile);
router.get('/:userId/profile', authenticateToken, requireAdmin, profileController.getUserProfile);

module.exports = router;
