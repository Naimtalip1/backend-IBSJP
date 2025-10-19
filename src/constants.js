/**
 * Application constants
 * Centralizes configuration values and magic strings/numbers
 */

module.exports = {
  // Admin configuration
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@jobportal.com',

  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // File upload configuration
  FILE_SIZE_LIMIT: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: /jpeg|jpg|png|gif|pdf|doc|docx|txt/,

  // Server configuration
  PORT: process.env.PORT || 5000,
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME || 'job_portal',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD,

  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Bcrypt configuration
  BCRYPT_ROUNDS: 10,

  // Application roles
  ROLES: {
    ADMIN: 'admin',
    USER: 'user'
  },

  // Job application statuses
  APPLICATION_STATUSES: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected'
  },

  // File paths
  UPLOADS_DIR: './uploads',

  // API response messages
  MESSAGES: {
    UNAUTHORIZED: 'Access denied',
    INVALID_TOKEN: 'Invalid token',
    ADMIN_REQUIRED: 'Admin access required',
    USER_NOT_FOUND: 'User not found',
    INVALID_CREDENTIALS: 'Invalid credentials',
    REGISTRATION_SUCCESS: 'User registered successfully',
    LOGIN_SUCCESS: 'Login successful'
  }
};