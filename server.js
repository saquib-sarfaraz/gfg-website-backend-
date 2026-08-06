const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Import routes
const homepageRoutes = require('./routes/homepageRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const mantriRoutes = require('./routes/mantriRoutes');
const teamRoutes = require('./routes/teamRoutes');
const eventRoutes = require('./routes/eventRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const memberRoutes = require('./routes/memberRoutes');
const formRoutes = require('./routes/formRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const postRoutes = require('./routes/postRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), message: 'GFG Campus Body API is active' });
});

// API Routes
app.use('/api/homepage', homepageRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/mantri', mantriRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = parseInt(process.env.PORT || '5001', 10);

const startServer = (portToTry) => {
  const server = app.listen(portToTry, () => {
    console.log(`====================================================`);
    console.log(`🚀 GFG CMP Server running on http://localhost:${portToTry}`);
    console.log(`🌐 Public Homepage API: http://localhost:${portToTry}/api/homepage`);
    console.log(`💬 Community Feed API: http://localhost:${portToTry}/api/posts`);
    console.log(`🔐 Admin Auth API: http://localhost:${portToTry}/api/auth/login`);
    console.log(`====================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${portToTry} is in use. Retrying on port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('[Server Error]:', err);
    }
  });
};

// Connect DB and launch server
connectDB().then(() => {
  startServer(PORT);
});
