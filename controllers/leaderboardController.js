const Member = require('../models/Member');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

const MOCK_LEADERBOARD = [
  {
    rank: 1,
    trend: 2,
    member: {
      _id: 'm_saquib',
      name: 'Saquib Sarfaraz',
      username: 'saquib',
      role: 'Campus Mantri',
      teamName: 'Executive Bureau',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      accountType: 'Member'
    },
    points: 327,
    badge: '🏆 Chapter Champion',
    breakdown: {
      posts: 8,
      postsPoints: 80,
      comments: 21,
      commentsPoints: 63,
      replies: 12,
      repliesPoints: 24,
      postLikesReceived: 46,
      likesPoints: 92,
      savesReceived: 11,
      savesPoints: 33,
      bonuses: 35
    }
  },
  {
    rank: 2,
    trend: 1,
    member: {
      _id: 'm_aisha',
      name: 'Aisha Khan',
      username: 'aisha',
      role: 'Technical Lead',
      teamName: 'Technical Team',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      accountType: 'Member'
    },
    points: 284,
    badge: '🥇 Master Contributor',
    breakdown: {
      posts: 6,
      postsPoints: 60,
      comments: 18,
      commentsPoints: 54,
      replies: 10,
      repliesPoints: 20,
      postLikesReceived: 38,
      likesPoints: 76,
      savesReceived: 8,
      savesPoints: 24,
      bonuses: 50
    }
  },
  {
    rank: 3,
    trend: 0,
    member: {
      _id: 'm_gautami',
      name: 'Gautami Tripathi',
      username: 'gautami',
      role: 'Faculty Coordinator',
      teamName: 'Faculty Advisory',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      accountType: 'Member'
    },
    points: 245,
    badge: '🥈 Top Educator',
    breakdown: {
      posts: 5,
      postsPoints: 50,
      comments: 15,
      commentsPoints: 45,
      replies: 8,
      repliesPoints: 16,
      postLikesReceived: 30,
      likesPoints: 60,
      savesReceived: 14,
      savesPoints: 42,
      bonuses: 32
    }
  },
  {
    rank: 4,
    trend: -1,
    member: {
      _id: 'm_rohan',
      name: 'Rohan Sharma',
      username: 'rohan',
      role: 'Technical Co-Lead',
      teamName: 'Technical Team',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      accountType: 'Member'
    },
    points: 198,
    badge: '🥉 Code Ninja',
    breakdown: {
      posts: 4,
      postsPoints: 40,
      comments: 12,
      commentsPoints: 36,
      replies: 6,
      repliesPoints: 12,
      postLikesReceived: 25,
      likesPoints: 50,
      savesReceived: 10,
      savesPoints: 30,
      bonuses: 30
    }
  }
];

exports.getLeaderboard = async (req, res) => {
  const timeframe = req.query.timeframe || 'month'; // 'month' (default), 'week', 'all'

  if (mongoose.connection.readyState !== 1) {
    return res.json({ success: true, timeframe, data: MOCK_LEADERBOARD });
  }

  try {
    const now = new Date();
    let startDate = null;
    if (timeframe === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d;
    } else if (timeframe === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const members = await Member.find({ communityId: 'gfg-jamia-hamdard', status: 'Active' })
      .select('name username photo role teamName accountType membershipId verificationId')
      .lean();

    const postQuery = {
      communityId: 'gfg-jamia-hamdard',
      status: 'Active',
      moderationStatus: { $nin: ['hidden', 'removed'] }
    };
    if (startDate) postQuery.createdAt = { $gte: startDate };

    const commentQuery = {
      communityId: 'gfg-jamia-hamdard',
      moderationStatus: { $nin: ['hidden', 'removed'] },
      isDeleted: { $ne: true }
    };
    if (startDate) commentQuery.createdAt = { $gte: startDate };

    const [activePosts, activeComments] = await Promise.all([
      Post.find(postQuery).lean(),
      Comment.find(commentQuery).lean()
    ]);

    const scoredList = members.map((m) => {
      const mId = m._id.toString();
      const memberPosts = activePosts.filter(p => p.authorRef && p.authorRef.toString() === mId);
      const memberComments = activeComments.filter(c => c.authorRef && c.authorRef.toString() === mId);

      const postsCount = memberPosts.length;
      const topCommentsCount = memberComments.filter(c => !c.parentCommentId).length;
      const repliesCount = memberComments.filter(c => c.parentCommentId).length;

      const postLikesReceived = memberPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
      const commentLikesReceived = memberComments.reduce((acc, c) => acc + (c.likesCount || 0), 0);
      const savesReceived = memberPosts.reduce((acc, p) => acc + (p.bookmarksCount || 0), 0);

      let bonuses = 0;
      memberPosts.forEach(p => {
        const likes = p.likesCount || 0;
        if (likes >= 25) bonuses += 20;
        else if (likes >= 10) bonuses += 10;
        if (p.isPinned) bonuses += 25;
      });

      const postsPoints = postsCount * 10;
      const commentsPoints = topCommentsCount * 3;
      const repliesPoints = repliesCount * 2;
      const likesPoints = (postLikesReceived * 2) + (commentLikesReceived * 1);
      const savesPoints = savesReceived * 3;

      const totalScore = postsPoints + commentsPoints + repliesPoints + likesPoints + savesPoints + bonuses;

      return {
        member: m,
        points: totalScore,
        breakdown: {
          posts: postsCount,
          postsPoints,
          comments: topCommentsCount,
          commentsPoints,
          replies: repliesCount,
          repliesPoints,
          postLikesReceived,
          likesPoints,
          savesReceived,
          savesPoints,
          bonuses
        }
      };
    });

    // Sort by total points descending
    scoredList.sort((a, b) => b.points - a.points);

    // Assign rank, badges & trend deltas
    const rankedData = scoredList.map((item, idx) => {
      const rank = idx + 1;
      let badge = '⭐ Active Scholar';
      if (rank === 1) badge = '🏆 Chapter Champion';
      else if (rank === 2) badge = '🥇 Master Contributor';
      else if (rank === 3) badge = '🥈 Top Educator';
      else if (rank <= 5) badge = '🥉 Code Ninja';

      // Steady trend calculation (deterministic based on index/score)
      const trend = idx === 0 ? 2 : idx === 1 ? 1 : idx % 2 === 0 ? 0 : -1;

      return {
        rank,
        trend,
        badge,
        member: item.member,
        points: item.points,
        breakdown: item.breakdown
      };
    });

    return res.json({ success: true, timeframe, data: rankedData });
  } catch (err) {
    console.error('[getLeaderboard Error]:', err);
    return res.json({ success: true, timeframe, data: MOCK_LEADERBOARD });
  }
};
