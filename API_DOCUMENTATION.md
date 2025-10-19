# Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## API Endpoints

### Authentication

#### Register User
- **POST** `/register`
- **Body:** `{ "email": "string", "password": "string", "name": "string" }`
- **Response:** User object with role assignment

#### Login User
- **POST** `/login`
- **Body:** `{ "email": "string", "password": "string" }`
- **Response:** JWT token and user object

### Jobs

#### Get All Jobs
- **GET** `/jobs`
- **Response:** Array of job objects

#### Create Job (Admin)
- **POST** `/jobs`
- **Headers:** Authorization required
- **Body:** `{ "title": "string", "company": "string", "description": "string" }`

### Job Applications

#### Apply for Job
- **POST** `/job-applications`
- **Headers:** Authorization required
- **Body:** `{ "jobId": "number" }`

#### Get User's Applications
- **GET** `/job-applications`
- **Headers:** Authorization required
- **Response:** Array of user's job applications

### User Profile Data

#### Personal Information
- **POST** `/personal-info`
- **GET** `/personal-info`
- **Headers:** Authorization required
- **Body:** Personal info object matching frontend PersonalInfo interface

#### Education
- **POST** `/education`
- **GET** `/education`
- **Headers:** Authorization required
- **Body:** Education object matching frontend Education interface

#### Employment History
- **POST** `/employment-history`
- **GET** `/employment-history`
- **Headers:** Authorization required
- **Body:** `{ "employmentHistory": [Employment objects] }`

#### Skills & Languages
- **POST** `/skills`
- **GET** `/skills`
- **Headers:** Authorization required
- **Body:** Skills object with languages array

#### References
- **POST** `/references`
- **GET** `/references`
- **Headers:** Authorization required
- **Body:** `{ "references": [Reference objects] }`

#### Declaration
- **POST** `/declaration`
- **GET** `/declaration`
- **Headers:** Authorization required
- **Body:** Declaration object

#### Complete Profile
- **GET** `/profile/complete`
- **Headers:** Authorization required
- **Response:** Complete user profile with all sections

### Document Upload

#### Upload Documents
- **POST** `/upload-documents`
- **Headers:** Authorization required
- **Content-Type:** multipart/form-data
- **Fields:** 
  - `resume` (file)
  - `coverLetter` (file)
  - `academicCertificates` (multiple files)
  - `idCopy` (file)
  - `portfolio` (file)

#### Get User Documents
- **GET** `/documents`
- **Headers:** Authorization required
- **Response:** Array of user's uploaded documents

### Admin Routes

#### Get All Applications (Admin Only)
- **GET** `/admin/applications`
- **Headers:** Authorization required (admin@jobportal.com)
- **Response:** All job applications with user details

#### Update Application Status (Admin Only)
- **PUT** `/admin/applications/:id/status`
- **Headers:** Authorization required (admin@jobportal.com)
- **Body:** `{ "status": "pending|approved|rejected" }`

## File Access
Uploaded files are accessible at:
```
http://localhost:5000/uploads/<filename>
```

## Error Responses
All endpoints return errors in this format:
```json
{
  "error": "Error message description"
}
```

## Status Codes
- 200: Success
- 201: Created
- 401: Unauthorized
- 403: Forbidden
- 500: Server Error