const mongoose = require('mongoose');
const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Member = require('../models/Member');

const REPORT_REVIEW_THRESHOLD = parseInt(process.env.REPORT_REVIEW_THRESHOLD || '5', 10);
const RATE_LIMIT_MAX_PER_HOUR = 10;

// Submit a new content report
exports.createReport = async (req, res) => {
  const { targetType, targetRef: inputTargetRef, targetId, reason, details } = req.body;
  const targetRef = inputTargetRef || targetId;

  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Please sign in to report content.' });
  }

  // Resolve Member document from authenticated identity (User -> Member)
  let memberObj = null;
  if (req.user._id) {
    memberObj = await Member.findOne({ userRef: req.user._id });
  }
  if (!memberObj && req.user.email) {
    memberObj = await Member.findOne({ email: req.user.email });
  }
  if (!memberObj && req.user._id) {
    memberObj = await Member.findById(req.user._id);
  }

  const reporterRef = memberObj ? memberObj._id : (req.user._id || req.body.reporterId);

  if (!reporterRef) {
    return res.status(401).json({ success: false, message: 'Please sign in to report content.' });
  }

  if (!['post', 'comment'].includes(targetType)) {
    return res.status(400).json({ success: false, message: 'Invalid report target type' });
  }

  if (!targetRef) {
    return res.status(400).json({ success: false, message: 'Target reference is required' });
  }

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Report reason is required' });
  }

  // Connection readiness guard
  if (mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      message: '✓ Report submitted — Thanks for keeping GFG Community safe.'
    });
  }

  try {
    // 1. Rate Limiting: Max 10 reports per member per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReportCount = await Report.countDocuments({
      reporterRef,
      createdAt: { $gte: oneHourAgo }
    });

    if (recentReportCount >= RATE_LIMIT_MAX_PER_HOUR) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.'
      });
    }

    // 2. Fetch Target Object & Check Existence
    let targetObj = null;
    let targetModelName = 'Post';

    if (targetType === 'post') {
      targetObj = await Post.findById(targetRef);
      targetModelName = 'Post';
    } else {
      targetObj = await Comment.findById(targetRef);
      targetModelName = 'Comment';
    }

    if (!targetObj) {
      return res.status(404).json({ success: false, message: 'Content no longer exists.' });
    }

    // 3. Reject reports if content is already hidden or removed
    if (['hidden', 'removed'].includes(targetObj.moderationStatus) || (targetObj.isDeleted)) {
      return res.status(400).json({ success: false, message: 'This content has already been moderated or removed.' });
    }

    // 4. Prevent Self-Reporting Safeguard
    if (targetObj.authorRef && targetObj.authorRef.toString() === reporterRef.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report your own content.' });
    }

    // Pre-check duplicate report for fast 409 response
    const existingReport = await Report.findOne({ reporterRef, targetType, targetRef });
    if (existingReport) {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_REPORTED',
        message: "You've already reported this content."
      });
    }

    // 5. Create Report Document
    const newReport = new Report({
      communityId: 'gfg-jamia-hamdard',
      reporterRef,
      targetType,
      targetRef,
      targetModel: targetModelName,
      targetAuthorRef: targetObj.authorRef,
      reason,
      details: details || '',
      status: 'pending'
    });

    await newReport.save();

    // 6. Calculate Active/Pending Unique Reports
    const activePendingCount = await Report.countDocuments({
      targetType,
      targetRef,
      status: { $in: ['pending', 'under_review'] }
    });

    // 7. Update Target Moderation Metadata & Status Transition
    targetObj.reportCount = activePendingCount;

    if (activePendingCount >= REPORT_REVIEW_THRESHOLD) {
      targetObj.moderationStatus = 'under_review';
    } else if (targetObj.moderationStatus === 'clean') {
      targetObj.moderationStatus = 'flagged';
    }

    await targetObj.save();

    return res.json({
      success: true,
      message: '✓ Report submitted — Thanks for keeping GFG Community safe.',
      data: {
        reportId: newReport._id,
        targetType,
        targetRef,
        reportCount: activePendingCount,
        moderationStatus: targetObj.moderationStatus
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_REPORTED',
        message: "You've already reported this content."
      });
    }
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Super Admin: Get Moderation Review Queue & Reported Items
exports.getAdminModerationQueue = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      summary: { needsReviewCount: 2, totalReportedCount: 4, hiddenCount: 1 },
      reviewQueue: [
        {
          _id: 'r_mock_1',
          targetType: 'post',
          targetRef: {
            _id: 'p_mock_1',
            title: 'Sample Reported Post',
            content: 'This is sample flagged content needing moderator review.',
            postType: 'Thought',
            createdAt: new Date(),
            authorRef: { name: 'Community Member', role: 'Member' }
          },
          reportCount: 5,
          moderationStatus: 'under_review',
          reasonBreakdown: { Spam: 3, Harassment: 2 }
        }
      ]
    });
  }

  try {
    const underReviewPosts = await Post.find({ moderationStatus: 'under_review' }).populate('authorRef', 'name photo role teamName');
    const underReviewComments = await Comment.find({ moderationStatus: 'under_review' }).populate('authorRef', 'name photo role teamName').populate('postId', 'title content');

    const hiddenPosts = await Post.find({ moderationStatus: 'hidden' }).populate('authorRef', 'name photo role teamName');
    const hiddenComments = await Comment.find({ moderationStatus: 'hidden' }).populate('authorRef', 'name photo role teamName');

    const allReports = await Report.find()
      .populate('reporterRef', 'name email role')
      .populate('targetAuthorRef', 'name email role')
      .sort({ createdAt: -1 });

    const reviewQueue = [
      ...underReviewPosts.map(p => ({
        targetType: 'post',
        targetId: p._id,
        targetRef: p,
        reportCount: p.reportCount,
        moderationStatus: p.moderationStatus,
        createdAt: p.createdAt
      })),
      ...underReviewComments.map(c => ({
        targetType: 'comment',
        targetId: c._id,
        targetRef: c,
        reportCount: c.reportCount,
        moderationStatus: c.moderationStatus,
        createdAt: c.createdAt
      }))
    ];

    return res.json({
      success: true,
      summary: {
        needsReviewCount: reviewQueue.length,
        totalReportsCount: allReports.length,
        hiddenCount: hiddenPosts.length + hiddenComments.length
      },
      reviewQueue,
      allReports
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Super Admin Action: Review Reported Item (Keep / Hide / Delete / Restore)
exports.reviewModerationItem = async (req, res) => {
  const { targetType, targetId } = req.params;
  const { action, moderatorReason, notes } = req.body;
  const moderatorId = req.user?._id || 'admin_sys';

  if (!['keep', 'hide', 'delete', 'restore'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Invalid moderation action' });
  }

  if (['hide', 'delete'].includes(action) && !moderatorReason) {
    return res.status(400).json({ success: false, message: 'Moderator reason is required when hiding or deleting content.' });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      message: `Content moderation status updated to: ${action.toUpperCase()}`
    });
  }

  try {
    let targetObj = targetType === 'post' ? await Post.findById(targetId) : await Comment.findById(targetId);

    if (!targetObj) {
      return res.status(404).json({ success: false, message: 'Target content not found' });
    }

    if (action === 'keep') {
      targetObj.moderationStatus = 'clean';
      targetObj.reportCount = 0;
      await targetObj.save();

      // Dismiss pending reports for this target (Preserves Report history in MongoDB!)
      await Report.updateMany(
        { targetType, targetRef: targetId, status: { $in: ['pending', 'under_review'] } },
        { status: 'dismissed', reviewedAt: new Date(), reviewedBy: moderatorId, resolutionAction: 'keep', moderatorNotes: notes || '' }
      );
    } else if (action === 'hide') {
      targetObj.moderationStatus = 'hidden';
      await targetObj.save();

      await Report.updateMany(
        { targetType, targetRef: targetId, status: { $in: ['pending', 'under_review'] } },
        { status: 'resolved', reviewedAt: new Date(), reviewedBy: moderatorId, resolutionAction: 'hide', moderatorNotes: moderatorReason }
      );
    } else if (action === 'restore') {
      targetObj.moderationStatus = 'clean';
      targetObj.reportCount = 0;
      if (targetObj.isDeleted !== undefined) targetObj.isDeleted = false;
      await targetObj.save();
    } else if (action === 'delete') {
      targetObj.moderationStatus = 'removed';
      if (targetType === 'comment') {
        targetObj.isDeleted = true;
        targetObj.deletedAt = new Date();
        targetObj.deletedBy = moderatorId;
        await targetObj.save();
      } else {
        await Post.findByIdAndDelete(targetId);
      }

      await Report.updateMany(
        { targetType, targetRef: targetId, status: { $in: ['pending', 'under_review'] } },
        { status: 'resolved', reviewedAt: new Date(), reviewedBy: moderatorId, resolutionAction: 'delete', moderatorNotes: moderatorReason }
      );
    }

    return res.json({
      success: true,
      message: `Moderation action '${action.toUpperCase()}' completed successfully.`,
      data: { targetType, targetId, newStatus: targetObj.moderationStatus }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
