const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
const AdminAuditLog = require('../models/AdminAuditLog');

const DEFAULT_SETTINGS = {
  communityId: 'gfg-jamia-hamdard',
  siteTitle: 'GeeksforGeeks Student Chapter | Jamia Hamdard',
  metaDescription: 'Official GeeksforGeeks Student Chapter Community Management Platform',
  heroHeading: 'Empowering Innovators, Coders & Future Tech Leaders',
  heroSubheading: 'Master Data Structures, Full-Stack Web Dev, Artificial Intelligence & Competitive Programming with Jamia Hamdard’s official GFG Campus Body.',
  ctaText: 'Explore Upcoming Events',
  ctaLink: '#events',
  contactEmail: 'gfg.chapter@jamiahamdard.ac.in',
  launchExperience: {
    enabled: false,
    duration: 7,
    replayMode: 'first_visit'
  }
};

exports.getSettings = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, data: DEFAULT_SETTINGS });
  }
  try {
    let settings = await SiteSettings.findOne({ communityId: 'gfg-jamia-hamdard' });
    if (!settings) {
      settings = DEFAULT_SETTINGS;
    }
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.json({ success: true, data: DEFAULT_SETTINGS });
  }
};

exports.updateSettings = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, data: { ...DEFAULT_SETTINGS, ...req.body } });
  }
  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { communityId: 'gfg-jamia-hamdard' },
      req.body,
      { new: true, upsert: true }
    );
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * Public Endpoint: Get Launch Experience Configuration
 * GET /api/settings/launch
 */
exports.getLaunchSettings = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        data: { enabled: false, duration: 7, replayMode: 'first_visit' }
      });
    }

    const settings = await SiteSettings.findOne(
      { communityId: 'gfg-jamia-hamdard' },
      'launchExperience'
    ).lean();

    return res.json({
      success: true,
      data: {
        enabled: Boolean(settings?.launchExperience?.enabled),
        duration: [5, 7, 10].includes(settings?.launchExperience?.duration) ? settings.launchExperience.duration : 7,
        replayMode: settings?.launchExperience?.replayMode === 'session' ? 'session' : 'first_visit'
      }
    });
  } catch (err) {
    console.warn('[SettingsController] Error fetching launch config:', err.message);
    return res.json({
      success: true,
      data: { enabled: false, duration: 7, replayMode: 'first_visit' }
    });
  }
};

/**
 * Protected Admin Endpoint: Update Launch Experience Configuration
 * PUT /api/settings/launch
 */
exports.updateLaunchSettings = async (req, res) => {
  try {
    const { enabled, duration, replayMode } = req.body;

    // Server-side strict validation
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameter "enabled": must be a boolean (true/false).'
      });
    }

    const validDurations = [5, 7, 10];
    const parsedDuration = Number(duration);
    if (!validDurations.includes(parsedDuration)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameter "duration": must be 5, 7, or 10 seconds.'
      });
    }

    const validReplayModes = ['first_visit', 'session'];
    const parsedReplayMode = validReplayModes.includes(replayMode) ? replayMode : 'first_visit';

    const updated = await SiteSettings.findOneAndUpdate(
      { communityId: 'gfg-jamia-hamdard' },
      {
        $set: {
          'launchExperience.enabled': enabled,
          'launchExperience.duration': parsedDuration,
          'launchExperience.replayMode': parsedReplayMode
        }
      },
      { new: true, upsert: true }
    );

    // Audit Log for security tracing
    try {
      if (req.user && AdminAuditLog) {
        await AdminAuditLog.create({
          action: 'UPDATE_LAUNCH_SETTINGS',
          category: 'SYSTEM',
          actorUserId: req.user._id,
          actorUsername: req.user.username || req.user.email,
          actorRole: req.user.role || 'Admin',
          details: {
            enabled,
            duration: parsedDuration,
            replayMode: parsedReplayMode
          },
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        });
      }
    } catch (auditErr) {
      console.warn('[SettingsController] Audit log write error:', auditErr.message);
    }

    return res.json({
      success: true,
      message: 'Launch experience settings updated successfully.',
      data: {
        enabled: updated.launchExperience.enabled,
        duration: updated.launchExperience.duration,
        replayMode: updated.launchExperience.replayMode
      }
    });
  } catch (err) {
    console.error('[SettingsController] Update launch settings failed:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update launch experience settings: ' + err.message
    });
  }
};
