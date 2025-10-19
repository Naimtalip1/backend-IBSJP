const express = require('express');
const authController = require('../controllers/authController.js');

const router = express.Router();

/**
 * POST /api/register - Register a new user
 */
router.post('/register', authController.register);

/**
 * POST /api/login - Login user
 */
router.post('/login', authController.login);

module.exports = router;
