const mongoose = require('mongoose');
const Member = require('../models/Member');
const Event = require('../models/Event');
const Resource = require('../models/Resource');
const Gallery = require('../models/Gallery');
const Report = require('../models/Report');
const Announcement = require('../models/Announcement');

exports.getStatsOverview = async (req, res) => {
  try {
    const communityId = 'gfg-jamia-hamdard';

    const totalAccounts = await Member.countDocuments({ communityId });
    const visitors = await Member.countDocuments({
      communityId,
      $or: [
        { accountType: { $regex: /^visitor$/i } },
        { role: { $regex: /^visitor$/i } }
      ]
    });
    const verifiedMembers = await Member.countDocuments({
      communityId,
      accountType: { $regex: /^member$/i }
    });
    const pending = await Member.countDocuments({
      communityId,
      membershipStatus: { $regex: /^pending$/i }
    });

    const totalEvents = await Event.countDocuments({ communityId });
    const upcomingEvents = await Event.countDocuments({
      communityId,
      status: { $in: ['Published', 'Registration Open', 'Live'] }
    });
    const completedEvents = await Event.countDocuments({
      communityId,
      status: 'Completed'
    });

    const totalGallery = await Gallery.countDocuments({ communityId });
    const totalResources = await Resource.countDocuments({ communityId });
    const publishedResources = await Resource.countDocuments({ communityId, status: 'Published' });

    const reportedItems = await Report.countDocuments({ communityId, moderationStatus: { $in: ['flagged', 'under_review'] } });
    const underReviewItems = await Report.countDocuments({ communityId, moderationStatus: 'under_review' });

    const totalAnnouncements = await Announcement.countDocuments({ communityId, status: 'Active' });

    return res.json({
      success: true,
      data: {
        members: {
          totalAccounts,
          visitors,
          verifiedMembers,
          pending
        },
        events: {
          total: totalEvents,
          upcoming: upcomingEvents,
          completed: completedEvents
        },
        gallery: {
          photos: totalGallery
        },
        resources: {
          total: totalResources,
          published: publishedResources
        },
        moderation: {
          reported: reportedItems,
          underReview: underReviewItems
        },
        announcements: {
          published: totalAnnouncements
        }
      }
    });
  } catch (err) {
    console.error('[Analytics Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute live dashboard statistics',
      error: err.message
    });
  }
};
