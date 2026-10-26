const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { db } = require('../db/database');
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const requestRoutes = require('../routes/requestRoutes');
const opportunityRoutes = require('../routes/opportunityRoutes');
const applicationRoutes = require('../routes/applicationRoutes');
const savedOpportunityRoutes = require('../routes/savedOpportunityRoutes');
const adminRoutes = require('../routes/adminRoutes');
const { errorHandler, notFound } = require('../middleware/errorHandler');

const app = express();
app.disable('x-powered-by');

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5500,http://localhost:5500')
  .split(',')
  .map((origin) => origin.trim());

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20kb' }));
const authLimit = (message, options = {}) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  ...options,
  handler(req, res) {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message }
    });
  }
});

app.post('/api/auth/register', authLimit('Too many registration attempts. Try again later.'));
app.post('/api/auth/login', authLimit('Too many failed login attempts. Try again later.', { skipSuccessfulRequests: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.get('/api/public-config', (req, res) => {
  return res.json({ success: true, data: { database: 'sqlite' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/saved-opportunities', savedOpportunityRoutes);
app.use('/api/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;