/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Handle multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large' });
    }
    return res.status(400).json({ error: 'File upload error' });
  }
  
  // Handle custom error messages
  if (err.message === 'Only images and documents are allowed') {
    return res.status(400).json({ error: err.message });
  }
  
  // Generic error response
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = {
  errorHandler
};
