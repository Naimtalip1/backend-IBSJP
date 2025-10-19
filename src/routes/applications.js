const express = require('express');
const applicationController = require('../controllers/applicationController.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

/**
 * User Job Applications Routes
 */
router.post('/', authenticateToken, applicationController.submitApplication);
router.get('/', authenticateToken, applicationController.getUserApplications);

module.exports = router;
