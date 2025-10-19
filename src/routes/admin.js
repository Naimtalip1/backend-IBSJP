const express = require('express');
const adminController = require('../controllers/adminController.js');
const applicationController = require('../controllers/applicationController.js');
const { authenticateToken, requireAdmin } = require('../middleware/auth.js');

const router = express.Router();

/**
 * Admin Users Routes
 */
router.get('/users', authenticateToken, requireAdmin, adminController.getAllUsers);

/**
 * Admin Applications Routes
 */
router.get('/applications', authenticateToken, requireAdmin, applicationController.getAllApplications);
router.put('/applications/:id/status', authenticateToken, requireAdmin, applicationController.updateApplicationStatus);

module.exports = router;
