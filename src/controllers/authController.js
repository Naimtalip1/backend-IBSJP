const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database.js');
const constants = require('../constants.js');

/**
 * Register a new user
 */
const register = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, constants.BCRYPT_ROUNDS);
    const role = email === constants.ADMIN_EMAIL ? constants.ROLES.ADMIN : constants.ROLES.USER;
    
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role', 
      [email, hashedPassword, name, role]
    );
    
    res.status(201).json({ 
      message: constants.MESSAGES.REGISTRATION_SUCCESS, 
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Login user with email and password
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: constants.MESSAGES.INVALID_CREDENTIALS });
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: constants.MESSAGES.INVALID_CREDENTIALS });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role }, 
      constants.JWT_SECRET, 
      { expiresIn: constants.JWT_EXPIRES_IN }
    );
    
    res.json({ 
      message: constants.MESSAGES.LOGIN_SUCCESS,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = {
  register,
  login
};
