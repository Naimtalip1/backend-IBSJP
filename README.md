# Backend IBSJP - Job Portal API

A Node.js backend API for a job portal application built with Express.js and PostgreSQL.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before setting up this project, make sure you have the following installed:

- **Node.js** (version 14.x or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** (version 12.x or higher)

### Installing PostgreSQL on Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### Installing PostgreSQL on macOS:
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

### Installing PostgreSQL on Windows:
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

## Database Setup

### Step 1: Start PostgreSQL Service

**Ubuntu/Debian:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew services start postgresql
```

**Windows:**
PostgreSQL service should start automatically after installation.

### Step 2: Access PostgreSQL

```bash
sudo -u postgres psql
```

If you're on macOS or Windows, you might use:
```bash
psql -U postgres
```

### Step 3: Create Database and User

Once in the PostgreSQL shell, run the following commands:

```sql
-- Create the database
CREATE DATABASE job_portal;

-- Create a user (optional - you can use the default postgres user)
CREATE USER job_portal_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE job_portal TO postgres;
-- If you created a custom user:
-- GRANT ALL PRIVILEGES ON DATABASE job_portal TO job_portal_user;

-- Exit PostgreSQL shell
\q
```

### Step 4: Verify Database Creation

```bash
sudo -u postgres psql -l
```

You should see `job_portal` in the list of databases.

## Installation

1. **Clone the repository:**
```bash
git clone <your-repository-url>
cd backend-IBSJP
```

2. **Install dependencies:**
```bash
npm install
```

## Configuration

1. **Create environment file:**
```bash
cp .env.example .env
```

2. **Edit the `.env` file with your database credentials:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=job_portal
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=5000
```

### Environment Variables Explanation:

- `DB_HOST`: PostgreSQL host (usually `localhost` for local development)
- `DB_PORT`: PostgreSQL port (default is `5432`)
- `DB_NAME`: Database name (`job_portal`)
- `DB_USER`: PostgreSQL username (default is `postgres`)
- `DB_PASSWORD`: Password for the PostgreSQL user
- `JWT_SECRET`: Secret key for JWT token generation (use a strong, random string)
- `PORT`: Port for the Express server (default is `5000`)

## Running the Application

### Development Mode:
```bash
npm start
```

### With Nodemon (auto-restart on changes):
```bash
npm run dev
```

If successful, you should see:
```
✓ Database connected successfully
Tables created or already exist
Backend server running on port 5000
Environment: development
```

## Database Schema

The application will automatically create the following tables on first run:

- **users** - User accounts and authentication
- **jobs** - Job postings
- **applications** - Job applications
- **skills** - User skills
- **documents** - Uploaded documents
- **profiles** - User profiles

## API Documentation

The API provides the following endpoints:

- **Authentication**: `/api/auth/*`
- **Jobs**: `/api/jobs/*`
- **Applications**: `/api/applications/*`
- **Profile**: `/api/profile/*`
- **Skills**: `/api/skills/*`
- **Documents**: `/api/documents/*`
- **Admin**: `/api/admin/*`

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Troubleshooting

### Common Issues:

#### 1. "database does not exist" Error
```bash
# Create the database manually
sudo -u postgres psql -c "CREATE DATABASE job_portal;"
```

#### 2. Authentication Failed for User
- Check your PostgreSQL password in the `.env` file
- Make sure PostgreSQL is running
- Verify user permissions

#### 3. Connection Refused Error
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql
```

#### 4. Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

#### 5. Permission Denied
Make sure your PostgreSQL user has the correct permissions:
```sql
-- Connect to PostgreSQL
sudo -u postgres psql

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE job_portal TO postgres;
```

### Resetting the Database

If you need to reset the database:

```bash
# Drop and recreate the database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS job_portal;"
sudo -u postgres psql -c "CREATE DATABASE job_portal;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE job_portal TO postgres;"
```

### Checking Database Connection

You can test the database connection using the included test script:

```bash
node test-db.js
```

## Development Tips

1. **Use a PostgreSQL GUI tool** like pgAdmin, DBeaver, or TablePlus for easier database management
2. **Monitor logs** for any database-related errors
3. **Regular backups** of your database during development
4. **Use environment-specific configurations** for different deployment environments

## Production Deployment

For production deployment:

1. Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
2. Set strong passwords and proper security groups
3. Use SSL connections
4. Regular database backups
5. Monitor database performance

## Support

If you encounter any issues not covered in this guide:

1. Check the application logs
2. Verify your PostgreSQL installation and configuration
3. Ensure all environment variables are correctly set
4. Review the troubleshooting section above

---

**Note**: Always use strong passwords and keep your environment variables secure, especially in production environments.