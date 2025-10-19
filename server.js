require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const constants = require('./src/constants.js');
const { createTables } = require('./src/config/initDb.js');
const pool = require('./src/config/database.js');
const { errorHandler } = require('./src/middleware/errorHandler.js');

// Route imports
const authRoutes = require('./src/routes/auth.js');
const jobRoutes = require('./src/routes/jobs.js');
const profileRoutes = require('./src/routes/profile.js');
const skillsRoutes = require('./src/routes/skills.js');
const applicationRoutes = require('./src/routes/applications.js');
const documentRoutes = require('./src/routes/documents.js');
const adminRoutes = require('./src/routes/admin.js');

const app = express();

// ==================== Middleware ====================

// Enable CORS for the frontend
app.use(cors({
  origin: constants.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, constants.UPLOADS_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// ==================== Routes ====================

// Auth routes
app.use('/api/auth', authRoutes);

// Job routes
app.use('/api/jobs', jobRoutes);

// Profile routes
app.use('/api/profile', profileRoutes);

// Skills and references routes
app.use('/api', skillsRoutes);

// Application routes
app.use('/api/job-applications', applicationRoutes);

// Document routes
app.use('/api/documents', documentRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Diagnostic endpoint - check jobs table
app.get('/api/diag/jobs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count,
             MIN(created_at) as oldest,
             MAX(created_at) as newest
      FROM jobs
    `);
    
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs'
      ORDER BY ordinal_position
    `);
    
    res.json({
      jobsTableStats: result.rows[0],
      jobsTableColumns: columns.rows,
      message: 'Diagnostic data retrieved'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Error Handling ====================

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// ==================== Server Startup ====================

const PORT = constants.PORT;

// Start server after creating tables
(async () => {
  try {
    await createTables();
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

module.exports = app;

