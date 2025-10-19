require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Enable CORS for the frontend running on localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image formats
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Create tables if they don't exist
const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        job_id INTEGER REFERENCES jobs(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS personal_info (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        full_name VARCHAR(255),
        identification_number VARCHAR(100),
        date_of_birth DATE,
        gender VARCHAR(20),
        nationality VARCHAR(100),
        race VARCHAR(100),
        marital_status VARCHAR(50),
        contact_number VARCHAR(50),
        current_address TEXT,
        permanent_address TEXT,
        same_as_current_address BOOLEAN DEFAULT false,
        expected_salary VARCHAR(100),
        preferred_position VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS education (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        highest_qualification VARCHAR(255),
        field_of_study VARCHAR(255),
        institution VARCHAR(255),
        year_graduated VARCHAR(10),
        cgpa VARCHAR(10),
        additional_certifications TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employment_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        company_name VARCHAR(255),
        position VARCHAR(255),
        start_date DATE,
        end_date DATE,
        is_currently_working BOOLEAN DEFAULT false,
        key_responsibilities TEXT,
        reason_for_leaving TEXT,
        reference_name VARCHAR(255),
        reference_position VARCHAR(255),
        reference_contact VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_skills (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        technical_skills TEXT[],
        soft_skills TEXT[],
        additional_competencies TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_languages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        language VARCHAR(100),
        proficiency VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_references (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name VARCHAR(255),
        relationship VARCHAR(255),
        company_position VARCHAR(255),
        contact_number VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        document_type VARCHAR(100),
        file_name VARCHAR(255),
        file_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS declarations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        agree_to_terms BOOLEAN DEFAULT false,
        signature VARCHAR(255),
        declaration_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables created or already exist');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
};

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = email === 'admin@jobportal.com' ? 'admin' : 'user';
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role', 
      [email, hashedPassword, name, role]
    );
    res.status(201).json({ 
      message: 'User registered', 
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
    res.json({ 
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
});

// Jobs routes
app.get('/api/jobs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

app.post('/api/jobs', authenticateToken, async (req, res) => {
  const { title, company, description } = req.body;
  try {
    const result = await pool.query('INSERT INTO jobs (title, company, description, user_id) VALUES ($1, $2, $3, $4) RETURNING *', [title, company, description, req.user.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create job' });
  }
});

app.put('/api/jobs/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, company, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE jobs SET title = $1, company = $2, description = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [title, company, description, id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job' });
  }
});

app.delete('/api/jobs/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found or unauthorized' });
    }
    
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Personal Info routes
app.post('/api/personal-info', authenticateToken, async (req, res) => {
  const { personalInfo } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO personal_info (
        user_id, full_name, identification_number, date_of_birth, gender, 
        nationality, race, marital_status, contact_number, current_address, 
        permanent_address, same_as_current_address, expected_salary, preferred_position
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        identification_number = EXCLUDED.identification_number,
        date_of_birth = EXCLUDED.date_of_birth,
        gender = EXCLUDED.gender,
        nationality = EXCLUDED.nationality,
        race = EXCLUDED.race,
        marital_status = EXCLUDED.marital_status,
        contact_number = EXCLUDED.contact_number,
        current_address = EXCLUDED.current_address,
        permanent_address = EXCLUDED.permanent_address,
        same_as_current_address = EXCLUDED.same_as_current_address,
        expected_salary = EXCLUDED.expected_salary,
        preferred_position = EXCLUDED.preferred_position,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      req.user.id, personalInfo.fullName, personalInfo.identificationNumber,
      personalInfo.dateOfBirth, personalInfo.gender, personalInfo.nationality,
      personalInfo.race, personalInfo.maritalStatus, personalInfo.contactNumber,
      personalInfo.currentAddress, personalInfo.permanentAddress,
      personalInfo.sameAsCurrentAddress, personalInfo.expectedSalary, personalInfo.preferredPosition
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving personal info:', err);
    res.status(500).json({ error: 'Failed to save personal info' });
  }
});

app.get('/api/personal-info', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personal_info WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch personal info' });
  }
});

// Education routes
app.post('/api/education', authenticateToken, async (req, res) => {
  const { education } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO education (
        user_id, highest_qualification, field_of_study, institution, 
        year_graduated, cgpa, additional_certifications
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        highest_qualification = EXCLUDED.highest_qualification,
        field_of_study = EXCLUDED.field_of_study,
        institution = EXCLUDED.institution,
        year_graduated = EXCLUDED.year_graduated,
        cgpa = EXCLUDED.cgpa,
        additional_certifications = EXCLUDED.additional_certifications,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      req.user.id, education.highestQualification, education.fieldOfStudy,
      education.institution, education.yearGraduated, education.cgpa,
      education.additionalCertifications
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving education:', err);
    res.status(500).json({ error: 'Failed to save education' });
  }
});

app.get('/api/education', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM education WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch education' });
  }
});

// Employment History routes
app.post('/api/employment-history', authenticateToken, async (req, res) => {
  const { employmentHistory } = req.body;
  try {
    // Delete existing employment history for user
    await pool.query('DELETE FROM employment_history WHERE user_id = $1', [req.user.id]);
    
    // Insert new employment history
    const insertPromises = employmentHistory.map(employment => {
      return pool.query(`
        INSERT INTO employment_history (
          user_id, company_name, position, start_date, end_date, 
          is_currently_working, key_responsibilities, reason_for_leaving,
          reference_name, reference_position, reference_contact
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        req.user.id, employment.companyName, employment.position,
        employment.startDate, employment.endDate, employment.isCurrentlyWorking,
        employment.keyResponsibilities, employment.reasonForLeaving,
        employment.referencePerson.name, employment.referencePerson.position,
        employment.referencePerson.contact
      ]);
    });
    
    const results = await Promise.all(insertPromises);
    res.json(results.map(r => r.rows[0]));
  } catch (err) {
    console.error('Error saving employment history:', err);
    res.status(500).json({ error: 'Failed to save employment history' });
  }
});

app.get('/api/employment-history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employment_history WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employment history' });
  }
});

// Skills routes
app.post('/api/skills', authenticateToken, async (req, res) => {
  const { skills } = req.body;
  try {
    // Save skills
    const skillsResult = await pool.query(`
      INSERT INTO user_skills (user_id, technical_skills, soft_skills, additional_competencies)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        technical_skills = EXCLUDED.technical_skills,
        soft_skills = EXCLUDED.soft_skills,
        additional_competencies = EXCLUDED.additional_competencies,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [req.user.id, skills.technicalSkills, skills.softSkills, skills.additionalCompetencies]);

    // Delete existing languages and insert new ones
    await pool.query('DELETE FROM user_languages WHERE user_id = $1', [req.user.id]);
    const languagePromises = skills.languages.map(lang => {
      return pool.query(
        'INSERT INTO user_languages (user_id, language, proficiency) VALUES ($1, $2, $3)',
        [req.user.id, lang.language, lang.proficiency]
      );
    });
    await Promise.all(languagePromises);

    res.json({ skills: skillsResult.rows[0], languages: skills.languages });
  } catch (err) {
    console.error('Error saving skills:', err);
    res.status(500).json({ error: 'Failed to save skills' });
  }
});

app.get('/api/skills', authenticateToken, async (req, res) => {
  try {
    const skillsResult = await pool.query('SELECT * FROM user_skills WHERE user_id = $1', [req.user.id]);
    const languagesResult = await pool.query('SELECT * FROM user_languages WHERE user_id = $1', [req.user.id]);
    
    res.json({
      skills: skillsResult.rows[0] || {},
      languages: languagesResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// References routes
app.post('/api/references', authenticateToken, async (req, res) => {
  const { references } = req.body;
  try {
    // Delete existing references
    await pool.query('DELETE FROM user_references WHERE user_id = $1', [req.user.id]);
    
    // Insert new references
    const insertPromises = references.map(ref => {
      return pool.query(`
        INSERT INTO user_references (user_id, name, relationship, company_position, contact_number, email)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [req.user.id, ref.name, ref.relationship, ref.companyPosition, ref.contactNumber, ref.email]);
    });
    
    const results = await Promise.all(insertPromises);
    res.json(results.map(r => r.rows[0]));
  } catch (err) {
    console.error('Error saving references:', err);
    res.status(500).json({ error: 'Failed to save references' });
  }
});

app.get('/api/references', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_references WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch references' });
  }
});

// Declaration routes
app.post('/api/declaration', authenticateToken, async (req, res) => {
  const { declaration } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO declarations (user_id, agree_to_terms, signature, declaration_date)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        agree_to_terms = EXCLUDED.agree_to_terms,
        signature = EXCLUDED.signature,
        declaration_date = EXCLUDED.declaration_date
      RETURNING *
    `, [req.user.id, declaration.agreeToTerms, declaration.signature, declaration.date]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error saving declaration:', err);
    res.status(500).json({ error: 'Failed to save declaration' });
  }
});

app.get('/api/declaration', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM declarations WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch declaration' });
  }
});

// Job Application routes
app.post('/api/job-applications', authenticateToken, async (req, res) => {
  const { jobId } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO job_applications (user_id, job_id, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `, [req.user.id, jobId]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating job application:', err);
    res.status(500).json({ error: 'Failed to create job application' });
  }
});

app.get('/api/job-applications', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ja.*, j.title, j.company, j.description 
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.user_id = $1
      ORDER BY ja.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job applications' });
  }
});

// Get complete user profile
app.get('/api/profile/complete', authenticateToken, async (req, res) => {
  try {
    const personalInfo = await pool.query('SELECT * FROM personal_info WHERE user_id = $1', [req.user.id]);
    const education = await pool.query('SELECT * FROM education WHERE user_id = $1', [req.user.id]);
    const employmentHistory = await pool.query('SELECT * FROM employment_history WHERE user_id = $1', [req.user.id]);
    const skills = await pool.query('SELECT * FROM user_skills WHERE user_id = $1', [req.user.id]);
    const languages = await pool.query('SELECT * FROM user_languages WHERE user_id = $1', [req.user.id]);
    const references = await pool.query('SELECT * FROM user_references WHERE user_id = $1', [req.user.id]);
    const declaration = await pool.query('SELECT * FROM declarations WHERE user_id = $1', [req.user.id]);

    res.json({
      personalInfo: personalInfo.rows[0] || {},
      education: education.rows[0] || {},
      employmentHistory: employmentHistory.rows,
      skills: {
        ...skills.rows[0] || {},
        languages: languages.rows
      },
      references: references.rows,
      declaration: declaration.rows[0] || {}
    });
  } catch (err) {
    console.error('Error fetching complete profile:', err);
    res.status(500).json({ error: 'Failed to fetch complete profile' });
  }
});

// Admin endpoint to get any user's complete profile
app.get('/api/admin/user/:userId/profile', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const personalInfo = await pool.query('SELECT * FROM personal_info WHERE user_id = $1', [userId]);
    const education = await pool.query('SELECT * FROM education WHERE user_id = $1', [userId]);
    const employmentHistory = await pool.query('SELECT * FROM employment_history WHERE user_id = $1', [userId]);
    const skills = await pool.query('SELECT * FROM user_skills WHERE user_id = $1', [userId]);
    const languages = await pool.query('SELECT * FROM user_languages WHERE user_id = $1', [userId]);
    const references = await pool.query('SELECT * FROM user_references WHERE user_id = $1', [userId]);
    const declaration = await pool.query('SELECT * FROM declarations WHERE user_id = $1', [userId]);
    const documents = await pool.query('SELECT * FROM user_documents WHERE user_id = $1', [userId]);

    res.json({
      personalInfo: personalInfo.rows[0] || {},
      education: education.rows[0] || {},
      employmentHistory: employmentHistory.rows,
      skills: {
        ...skills.rows[0] || {},
        languages: languages.rows
      },
      references: references.rows,
      declaration: declaration.rows[0] || {},
      documents: documents.rows
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// File upload routes
app.post('/api/upload-documents', authenticateToken, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 },
  { name: 'academicCertificates', maxCount: 10 },
  { name: 'idCopy', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 }
]), async (req, res) => {
  try {
    // Delete existing documents for user
    await pool.query('DELETE FROM user_documents WHERE user_id = $1', [req.user.id]);
    
    const insertPromises = [];
    
    // Process uploaded files
    Object.keys(req.files).forEach(fieldName => {
      const files = req.files[fieldName];
      files.forEach(file => {
        insertPromises.push(
          pool.query(
            'INSERT INTO user_documents (user_id, document_type, file_name, file_path) VALUES ($1, $2, $3, $4)',
            [req.user.id, fieldName, file.originalname, `/uploads/${file.filename}`]
          )
        );
      });
    });
    
    await Promise.all(insertPromises);
    
    res.json({ 
      message: 'Documents uploaded successfully',
      files: req.files 
    });
  } catch (err) {
    console.error('Error uploading documents:', err);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_documents WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Admin routes for managing applications
app.get('/api/admin/applications', authenticateToken, async (req, res) => {
  try {
    // Simple admin check - you might want to add proper role-based authentication
    if (req.user.email !== 'admin@jobportal.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const result = await pool.query(`
      SELECT 
        ja.*,
        u.email as user_email,
        pi.full_name,
        j.title as job_title,
        j.company
      FROM job_applications ja
      JOIN users u ON ja.user_id = u.id
      LEFT JOIN personal_info pi ON ja.user_id = pi.user_id
      JOIN jobs j ON ja.job_id = j.id
      ORDER BY ja.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.put('/api/admin/applications/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    if (req.user.email !== 'admin@jobportal.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const result = await pool.query(
      'UPDATE job_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating application status:', err);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Admin route to get all users with their statistics
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.email !== 'admin@jobportal.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at,
        pi.full_name,
        pi.contact_number,
        pi.preferred_position,
        COUNT(ja.id) as applications_count,
        MAX(ja.created_at) as last_application
      FROM users u
      LEFT JOIN personal_info pi ON u.id = pi.user_id
      LEFT JOIN job_applications ja ON u.id = ja.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id, u.email, u.role, u.created_at, pi.full_name, pi.contact_number, pi.preferred_position
      ORDER BY u.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

const PORT = process.env.PORT || 5000;

// Start server after creating tables
(async () => {
  await createTables();
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
})();