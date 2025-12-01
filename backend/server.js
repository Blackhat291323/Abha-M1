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

// CORS configuration - allow same origin and local development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like same-origin requests, mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow any Vercel deployment URL for this project
    if (origin.includes('vercel.app') || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all in monorepo setup
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Token']
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
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 ABHA Backend server running on ${HOST}:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Base URL: http://${HOST}:${PORT}`);
});

module.exports = app;
