const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const sessionRoutes = require('./routes/session');
const enrollmentRoutes = require('./routes/enrollment');
const searchRoutes = require('./routes/search');
const profileRoutes = require('./routes/profile');
const loginRoutes = require('./routes/login');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// CORS configuration - allow Netlify frontend
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://abha-m1.netlify.app/', // UPDATE THIS
        'http://localhost:8000' // for local testing
      ]
    : '*', // Allow all in development
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ABHA Backend API is running' });
});

// API Routes
app.use('/api/session', sessionRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/login', loginRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ABHA Backend server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
});

module.exports = app;
