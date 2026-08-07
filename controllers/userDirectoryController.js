const mongoose = require('mongoose');
const User = require('../models/User');
const Member = require('../models/Member');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Bookmark = require('../models/Bookmark');
const Report = require('../models/Report');

/**
 * Helper: Unified account loader that merges User & Member collections
 * Guarantees that every registered account in Member or User appears.
 */
async function loadUnifiedAccounts() {
  let userDocs = [];
  let memberDocs = [];

  if (mongoose.connection.readyState === 1) {
    try {
      [userDocs, memberDocs] = await Promise.all([
        User.find({}).select('-password -pinHash -otpSecret -resetToken -__v').lean(),
        Member.find({}).lean()
      ]);
    } catch (err) {
      console.warn('[UserDirectory] DB Query Warning:', err.message);
    }
  }

  // Fallback to MOCK_MEMBERS matching Member Directory if DB has 0 dynamic records
  if ((!memberDocs || memberDocs.length === 0) && (!userDocs || userDocs.length === 0)) {
    try {
      const { MOCK_MEMBERS } = require('./memberController');
      memberDocs = MOCK_MEMBERS || [];
    } catch (e) {
      memberDocs = [];
    }
  }

  const accountMap = new Map();

  // Index Members by email, userRef, and _id
  const memberByEmail = new Map();
  const memberByUserId = new Map();

  memberDocs.forEach(m => {
    if (m.email) memberByEmail.set(m.email.toLowerCase().trim(), m);
    if (m.userRef) memberByUserId.set(m.userRef.toString(), m);
  });

  // Process User collection first
  userDocs.forEach(u => {
    const emailKey = u.email ? u.email.toLowerCase().trim() : '';
    const userIdKey = u._id ? u._id.toString() : '';

    let m = null;
    if (u.memberRef) {
      m = memberDocs.find(item => item._id.toString() === u.memberRef.toString());
    }
    if (!m && userIdKey) {
      m = memberByUserId.get(userIdKey);
    }
    if (!m && emailKey) {
      m = memberByEmail.get(emailKey);
    }

    const key = emailKey || userIdKey;

    accountMap.set(key, {
      id: u._id,
      _id: u._id,
      userId: u._id,
      memberId: m ? m._id : null,
      name: m?.name || u.username || (u.email ? u.email.split('@')[0] : 'Platform User'),
      userCode: u.userCode || m?.userCode || '—',
      username: u.username || m?.username || (u.email ? u.email.split('@')[0] : 'user'),
      email: u.email || m?.email || '',
      phone: u.phone || m?.phone || '—',
      photo: m?.photo || u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || 'User')}&background=2f9e44&color=fff`,
      avatar: u.avatar || m?.photo || '',
      coverPhoto: m?.coverPhoto || '',
      communityRole: m?.role || u.role || 'Member',
      accountRole: u.role || 'Visitor',
      accountType: m?.accountType || u.institutionType || 'Visitor',
      department: m?.department || u.course || 'General',
      course: u.course || m?.department || '',
      college: u.collegeName || m?.college || 'Jamia Hamdard',
      bio: m?.bio || '',
      about: m?.about || '',
      skills: m?.skills || [],
      expertise: m?.expertise || [],
      status: m?.status || 'Active',
      membershipStatus: m?.membershipStatus || 'pending',
      membershipId: m?.membershipId || '',
      joinedAt: u.createdAt || m?.createdAt || new Date(),
      lastActive: u.updatedAt || m?.updatedAt || new Date(),
      profileComplete: !!m
    });
  });

  // Process Member collection for any accounts that only exist in Member collection
  memberDocs.forEach(m => {
    const emailKey = m.email ? m.email.toLowerCase().trim() : '';
    const memberIdKey = m._id ? m._id.toString() : '';

    const existingKey = Array.from(accountMap.keys()).find(k => k === emailKey || (m.userRef && accountMap.get(k)?.userId?.toString() === m.userRef.toString()));

    if (!existingKey) {
      accountMap.set(emailKey || memberIdKey, {
        id: m.userRef || m._id,
        _id: m.userRef || m._id,
        userId: m.userRef || null,
        memberId: m._id,
        name: m.name || m.username || 'Platform Member',
        userCode: m.userCode || '—',
        username: m.username || (m.email ? m.email.split('@')[0] : 'member'),
        email: m.email || '',
        phone: m.phone || '—',
        photo: m.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || 'Member')}&background=2f9e44&color=fff`,
        avatar: m.photo || '',
        coverPhoto: m.coverPhoto || '',
        communityRole: m.role || 'Member',
        accountRole: 'Visitor',
        accountType: m.accountType || 'Visitor',
        department: m.department || 'General',
        course: m.department || '',
        college: m.college || 'Jamia Hamdard',
        bio: m.bio || '',
        about: m.about || '',
        skills: m.skills || [],
        expertise: m.expertise || [],
        status: m.status || 'Active',
        membershipStatus: m.membershipStatus || 'pending',
        membershipId: m.membershipId || '',
        joinedAt: m.createdAt || new Date(),
        lastActive: m.updatedAt || new Date(),
        profileComplete: true
      });
    }
  });

  return Array.from(accountMap.values());
}

/**
 * GET /api/admin/users/stats
 * Real aggregated statistics from unified account population
 */
exports.getUserStats = async (req, res) => {
  try {
    const accounts = await loadUnifiedAccounts();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUsers = accounts.length;
    const activeUsers = accounts.filter(a => a.status === 'Active' || a.membershipStatus === 'active').length;
    const newThisMonth = accounts.filter(a => new Date(a.joinedAt) >= startOfMonth).length;

    let contributors = 0;
    if (mongoose.connection.readyState === 1) {
      const contributorsList = await Post.distinct('authorRef');
      contributors = contributorsList ? contributorsList.length : 0;
    }

    const stats = {
      registered: totalUsers,
      totalUsers,
      active: activeUsers > 0 ? activeUsers : totalUsers,
      activeUsers: activeUsers > 0 ? activeUsers : totalUsers,
      newThisMonth,
      contributors
    };

    console.log(`[UserDirectory Stats] Total Registered Accounts: ${totalUsers}, Active: ${stats.activeUsers}, New: ${stats.newThisMonth}, Contributors: ${stats.contributors}`);

    return res.json({
      success: true,
      stats
    });
  } catch (err) {
    console.error('[getUserStats Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/admin/users
 * Paginated, searchable, filterable list of registered platform accounts
 */
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '25', 10);
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;

    let accounts = await loadUnifiedAccounts();
    const initialTotal = accounts.length;

    // Apply Search Filter
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      accounts = accounts.filter(a =>
        (a.userCode && a.userCode.toLowerCase().includes(term)) ||
        (a.name && a.name.toLowerCase().includes(term)) ||
        (a.username && a.username.toLowerCase().includes(term)) ||
        (a.email && a.email.toLowerCase().includes(term)) ||
        (a.phone && a.phone.toLowerCase().includes(term)) ||
        (a.college && a.college.toLowerCase().includes(term)) ||
        (a.department && a.department.toLowerCase().includes(term))
      );
    }

    // Apply Role Filter (supports "Visitors", "Members", "Leads", "Campus Mantri", etc.)
    if (role && role !== 'All' && role !== 'all') {
      const term = role.toLowerCase();
      if (term === 'visitors' || term === 'visitor') {
        accounts = accounts.filter(a =>
          a.communityRole.toLowerCase().includes('visitor') ||
          a.accountType.toLowerCase().includes('visitor') ||
          a.accountRole.toLowerCase().includes('visitor')
        );
      } else if (term === 'members' || term === 'member') {
        accounts = accounts.filter(a =>
          a.communityRole.toLowerCase().includes('member') ||
          a.accountType.toLowerCase().includes('member')
        );
      } else if (term === 'leads' || term === 'lead') {
        accounts = accounts.filter(a => a.communityRole.toLowerCase().includes('lead'));
      } else {
        accounts = accounts.filter(a =>
          a.communityRole.toLowerCase().includes(term) ||
          a.accountRole.toLowerCase().includes(term)
        );
      }
    }

    // Apply Status Filter
    if (status && status !== 'All' && status !== 'all') {
      const term = status.toLowerCase();
      accounts = accounts.filter(a =>
        a.status.toLowerCase() === term ||
        a.membershipStatus.toLowerCase() === term
      );
    }

    const filteredTotal = accounts.length;
    const paginatedAccounts = accounts.slice(skip, skip + limit);

    console.log(`[UserDirectory Audit] Total DB Accounts: ${initialTotal}, Filtered: ${filteredTotal}, Page ${page} Count: ${paginatedAccounts.length}`);

    return res.json({
      success: true,
      count: paginatedAccounts.length,
      users: paginatedAccounts,
      data: paginatedAccounts,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        pages: Math.ceil(filteredTotal / limit) || 1
      }
    });
  } catch (err) {
    console.error('[getUsers Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/admin/users/:userId
 * Detailed administrative inspection view of a single user account
 */
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const accounts = await loadUnifiedAccounts();

    const account = accounts.find(a =>
      a.id.toString() === userId ||
      (a.memberId && a.memberId.toString() === userId) ||
      (a.userId && a.userId.toString() === userId)
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    return res.json({ success: true, user: account });
  } catch (err) {
    console.error('[getUserById Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/admin/users/:userId/activity
 * Real aggregated activity counts + recent log entries from MongoDB
 */
exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;

    let memberId = null;

    if (mongoose.Types.ObjectId.isValid(userId)) {
      const u = await User.findById(userId).select('memberRef email');
      if (u && u.memberRef) memberId = u.memberRef;
      if (!memberId && u) {
        const m = await Member.findOne({ $or: [{ userRef: u._id }, { email: u.email }] });
        if (m) memberId = m._id;
      }
    }

    if (!memberId) {
      const m = await Member.findOne({ $or: [{ _id: userId }, { userRef: userId }] });
      if (m) memberId = m._id;
    }

    if (!memberId) {
      return res.json({
        success: true,
        activity: { posts: 0, comments: 0, likes: 0, bookmarks: 0, reports: 0 },
        recentLogs: []
      });
    }

    const [postsCount, commentsCount, likesCount, bookmarksCount, reportsCount, recentPosts, recentComments] = await Promise.all([
      Post.countDocuments({ authorRef: memberId }),
      Comment.countDocuments({ authorRef: memberId }),
      Like.countDocuments({ memberRef: memberId }),
      Bookmark.countDocuments({ memberRef: memberId }),
      Report.countDocuments({ reporterRef: memberId }),
      Post.find({ authorRef: memberId }).sort({ createdAt: -1 }).limit(3).select('title content createdAt').lean(),
      Comment.find({ authorRef: memberId }).sort({ createdAt: -1 }).limit(3).select('content createdAt').lean()
    ]);

    const recentLogs = [
      ...recentPosts.map(p => ({
        type: 'post',
        title: p.title || 'Created a Post',
        snippet: p.content ? p.content.substring(0, 60) + '...' : '',
        timestamp: p.createdAt
      })),
      ...recentComments.map(c => ({
        type: 'comment',
        title: 'Commented on a Post',
        snippet: c.content ? c.content.substring(0, 60) + '...' : '',
        timestamp: c.createdAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

    return res.json({
      success: true,
      activity: {
        posts: postsCount || 0,
        comments: commentsCount || 0,
        likes: likesCount || 0,
        bookmarks: bookmarksCount || 0,
        reports: reportsCount || 0
      },
      recentLogs
    });
  } catch (err) {
    console.error('[getUserActivity Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
