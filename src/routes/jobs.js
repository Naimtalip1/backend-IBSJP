const express = require('express');
const jobController = require('../controllers/jobController.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

/**
 * GET /api/jobs - Get all jobs
 */
router.get('/', jobController.getAllJobs);

/**
 * POST /api/jobs - Create a new job
 */
router.post('/', authenticateToken, jobController.createJob);

/**
 * PUT /api/jobs/:id - Update a job
 */
router.put('/:id', authenticateToken, jobController.updateJob);

/**
 * DELETE /api/jobs/:id - Delete a job
 */
router.delete('/:id', authenticateToken, jobController.deleteJob);

module.exports = router;
