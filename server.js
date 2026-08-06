const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const homepageRoutes = require('./routes/homepageRoutes');
const memberRoutes = require('./routes/memberRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const mantriRoutes = require('./routes/mantriRoutes');
const teamRoutes = require('./routes/teamRoutes');
const eventRoutes = require('./routes/eventRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const formRoutes = require('./routes/formRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const postRoutes = require('./routes/postRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve local media uploads fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GeeksforGeeks CMP Backend Engine operational', timestamp: new Date() });
});

// Mounting Modular REST APIs
app.use('/api/auth', authRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/mantri', mantriRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/reports', reportRoutes);

// Global 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5001;

// Connect DB and launch server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 GFG CMP Server running on http://localhost:${PORT}`);
    console.log(`🌐 Public Homepage API: http://localhost:${PORT}/api/homepage`);
    console.log(`💬 Community Feed API: http://localhost:${PORT}/api/posts`);
    console.log(`🔐 Admin Auth API: http://localhost:${PORT}/api/auth/login`);
    console.log(`====================================================`);
  });
});

// reload nodemon
