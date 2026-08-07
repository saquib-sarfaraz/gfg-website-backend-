const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Bookmark = require('../models/Bookmark');
const Like = require('../models/Like');
const Member = require('../models/Member');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const { notifyPostUpdated, getIO } = require('../config/socket');
const { deleteAssets } = require('../services/cloudinaryService');

const MOCK_POSTS = [
  {
    _id: 'p1',
    postType: 'Thought',
    title: 'Graph Problem Solved!',
    content: 'Finally solved today’s Graph Dijkstra problem on GeeksforGeeks after three attempts! Focus on edge weight relaxation logic.',
    tags: ['DSA', 'Graphs', 'GFG'],
    likesCount: 42,
    commentsCount: 5,
    bookmarksCount: 12,
    isPinned: true,
    createdAt: new Date('2026-07-29T10:00:00.000Z'),
    authorRef: {
      _id: 'm_saquib',
      name: 'Saquib Sarfaraz',
      role: 'Campus Mantri',
      photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
    },
    media: []
  },
  {
    _id: 'p2',
    postType: 'Study Note',
    title: 'Operating System Process Scheduling Notes',
    content: 'Here are my handwritten & structured OS CPU scheduling notes (FCFS, SJF, Round Robin, Priority Scheduling) before tomorrow’s mid-sem exam!',
    media: [
      {
        type: 'pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileName: 'OS_Process_Scheduling_Notes.pdf',
        size: 2450000
      }
    ],
    tags: ['OS', 'DBMS', 'Exams'],
    likesCount: 58,
    commentsCount: 8,
    bookmarksCount: 34,
    isPinned: false,
    createdAt: new Date('2026-07-28T14:30:00.000Z'),
    authorRef: {
      _id: 'm_gautami',
      name: 'Gautami Tripathi',
      role: 'Faculty Coordinator',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
    }
  },
  {
    _id: 'p3',
    postType: 'Achievement',
    title: 'Cracked Summer SDE Internship!',
    content: 'Super thrilled to share that I passed all rounds and secured my SDE Internship offer for Summer 2026! Big thanks to GFG campus chapter mentors.',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
        fileName: 'internship_offer.jpg'
      }
    ],
    tags: ['Placement', 'Career', 'Internship'],
    likesCount: 94,
    commentsCount: 14,
    bookmarksCount: 19,
    isPinned: false,
    createdAt: new Date('2026-07-27T09:15:00.000Z'),
    authorRef: {
      _id: 'm_aisha',
      name: 'Aisha Khan',
      role: 'Technical Lead',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
    }
  },
  {
    _id: 'p4',
    postType: 'Question',
    title: 'Can someone explain Binary Lifting in Trees?',
    content: 'Struggling to find Lowest Common Ancestor (LCA) using Binary Lifting in O(log N). Can anyone share an intuitive code snippet?',
    tags: ['DSA', 'Trees', 'CP'],
    likesCount: 18,
    commentsCount: 6,
    bookmarksCount: 7,
    isPinned: false,
    createdAt: new Date('2026-07-26T18:00:00.000Z'),
    authorRef: {
      _id: 'm_rohan',
      name: 'Rohan Sharma',
      role: 'Technical Co-Lead',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
    },
    media: []
  },
  {
    _id: 'p5',
    postType: 'Opportunity',
    title: 'Microsoft Software Engineer Intern 2027 Hiring Open',
    content: 'Microsoft has opened applications for 2027 batch SDE Internships. Apply on Microsoft Careers portal before August 10th!',
    media: [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
        fileName: 'microsoft_hiring.jpg'
      }
    ],
    externalUrl: 'https://careers.microsoft.com',
    tags: ['Placement', 'Hiring', 'Opportunity'],
    likesCount: 112,
    commentsCount: 11,
    bookmarksCount: 88,
    isPinned: true,
    createdAt: new Date('2026-07-25T11:00:00.000Z'),
    authorRef: {
      _id: 'm_zoya',
      name: 'Zoya Verma',
      role: 'Design & PR Lead',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
    }
  }
];

const MOCK_LIKES = new Set();
const MOCK_BOOKMARKS = new Set();

const getOrCreateDefaultMember = async () => {
  let member = await Member.findOne({ status: 'Active' });
  if (!member) {
    member = await Member.create({
      name: 'Saquib Sarfaraz',
      email: 'saquib@gfg.org',
      role: 'Campus Mantri',
      teamName: 'Executive Team',
      status: 'Active'
    });
  }
  return member._id;
};

const resolveMemberFromReq = async (req) => {
  const inputId = req.body?.memberId || req.query?.memberId || req.body?.authorRef;
  if (inputId && mongoose.Types.ObjectId.isValid(inputId)) {
    return inputId;
  }
  if (req.user) {
    let member = await Member.findOne({ userRef: req.user._id });
    if (!member && req.user.email) {
      member = await Member.findOne({ email: req.user.email });
    }
    if (member) return member._id.toString();
  }
  return await getOrCreateDefaultMember();
};

exports.getPosts = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    let result = MOCK_POSTS.map(p => ({
      ...p,
      isLiked: MOCK_LIKES.has(p._id),
      isBookmarked: MOCK_BOOKMARKS.has(p._id)
    }));

    const { type, tag, search, filter: navFilter, memberId } = req.query;

    if (type && type !== 'All') {
      result = result.filter(p => p.postType === type);
    }
    if (tag && tag !== 'All') {
      result = result.filter(p => p.tags && p.tags.includes(tag.replace('#', '')));
    }
    if (search) {
      result = result.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()));
    }
    if (navFilter === 'Saved') {
      result = result.filter(p => p.isBookmarked);
    } else if (navFilter === 'My Posts' && memberId) {
      result = result.filter(p => p.authorRef?._id === memberId);
    }

    return res.json({ success: true, count: result.length, data: result });
  }

  try {
    const { type, tag, search, pinnedOnly, filter: navFilter, memberId: inputMemberId } = req.query;
    const memberId = inputMemberId && mongoose.Types.ObjectId.isValid(inputMemberId) ? inputMemberId : await resolveMemberFromReq(req);

    const filterQuery = {
      communityId: 'gfg-jamia-hamdard',
      status: 'Active',
      moderationStatus: { $nin: ['hidden', 'removed'] }
    };

    if (type && type !== 'All') filterQuery.postType = type;
    if (tag && tag !== 'All') filterQuery.tags = { $in: [tag.replace('#', '')] };
    if (pinnedOnly === 'true') filterQuery.isPinned = true;
    if (search) {
      filterQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by Saved / My Posts
    const lowerNav = navFilter ? navFilter.toLowerCase() : '';
    if (lowerNav === 'saved' && memberId && mongoose.Types.ObjectId.isValid(memberId)) {
      const userBookmarks = await Bookmark.find({ memberRef: memberId }).select('postRef');
      const savedPostIds = userBookmarks.map(b => b.postRef);
      filterQuery._id = { $in: savedPostIds };
    } else if ((lowerNav === 'my posts' || lowerNav === 'my_posts') && memberId && mongoose.Types.ObjectId.isValid(memberId)) {
      filterQuery.authorRef = memberId;
    }

    let posts = await Post.find(filterQuery)
      .populate('authorRef', 'name photo role teamName email')
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    // Attach user isLiked & isBookmarked flags
    if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
      const postIds = posts.map(p => p._id);
      const [userLikes, userBookmarks] = await Promise.all([
        Like.find({ memberRef: memberId, postRef: { $in: postIds } }).select('postRef'),
        Bookmark.find({ memberRef: memberId, postRef: { $in: postIds } }).select('postRef')
      ]);

      const likedSet = new Set(userLikes.map(l => l.postRef.toString()));
      const bookmarkedSet = new Set(userBookmarks.map(b => b.postRef.toString()));

      posts = posts.map(p => ({
        ...p,
        isLiked: likedSet.has(p._id.toString()),
        isBookmarked: bookmarkedSet.has(p._id.toString())
      }));
    } else {
      posts = posts.map(p => ({ ...p, isLiked: false, isBookmarked: false }));
    }

    return res.json({ success: true, count: posts.length, data: posts });
  } catch (err) {
    console.error('Error fetching posts:', err);
    return res.json({ success: true, count: MOCK_POSTS.length, data: MOCK_POSTS });
  }
};

exports.getPostById = async (req, res) => {
  const { id } = req.params;
  const { memberId } = req.query;

  if (mongoose.connection.readyState !== 1) {
    const post = MOCK_POSTS.find(p => p._id === id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    return res.json({
      success: true,
      data: {
        ...post,
        isLiked: MOCK_LIKES.has(id),
        isBookmarked: MOCK_BOOKMARKS.has(id)
      }
    });
  }

  try {
    const post = await Post.findById(id).populate('authorRef', 'name photo role teamName email').lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    let isLiked = false;
    let isBookmarked = false;

    if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
      const [likeDoc, bookmarkDoc] = await Promise.all([
        Like.findOne({ memberRef: memberId, postRef: id }),
        Bookmark.findOne({ memberRef: memberId, postRef: id })
      ]);
      isLiked = !!likeDoc;
      isBookmarked = !!bookmarkDoc;
    }

    return res.json({
      success: true,
      data: {
        ...post,
        isLiked,
        isBookmarked
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.createPost = async (req, res) => {
  let { authorRef, postType, title, content, media, externalUrl, tags } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const newPost = {
      _id: 'p_' + Date.now(),
      postType: postType || 'Thought',
      title: title || '',
      content: content || '',
      media: media || [],
      externalUrl: externalUrl || '',
      tags: tags || [],
      likesCount: 0,
      commentsCount: 0,
      bookmarksCount: 0,
      createdAt: new Date(),
      authorRef: {
        _id: 'm_saquib',
        name: 'Saquib Sarfaraz',
        role: 'Campus Mantri',
        photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
      }
    };
    MOCK_POSTS.unshift(newPost);
    return res.status(201).json({ success: true, data: newPost });
  }

  try {
    const authorRef = await resolveMemberFromReq(req);

    const post = await Post.create({
      communityId: 'gfg-jamia-hamdard',
      authorRef,
      postType: postType || 'Thought',
      title: title || '',
      content,
      media: media || [],
      externalUrl: externalUrl || '',
      tags: tags || []
    });

    const populated = await Post.findById(post._id).populate('authorRef', 'name photo role teamName email');
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  const { id } = req.params;
  let { memberId } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const target = MOCK_POSTS.find(p => p._id === id);
    const isLiked = MOCK_LIKES.has(id);
    if (isLiked) {
      MOCK_LIKES.delete(id);
      if (target) target.likesCount = Math.max(0, (target.likesCount || 1) - 1);
    } else {
      MOCK_LIKES.add(id);
      if (target) target.likesCount = (target.likesCount || 0) + 1;
    }
    return res.json({ success: true, likesCount: target ? target.likesCount : 1, isLiked: !isLiked });
  }

  try {
    const memberId = await resolveMemberFromReq(req);

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const existingLike = await Like.findOne({ memberRef: memberId, postRef: id });

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id);
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save();
      notifyPostUpdated(id, { likesCount: post.likesCount });
      return res.json({ success: true, likesCount: post.likesCount, isLiked: false });
    } else {
      await Like.create({ communityId: 'gfg-jamia-hamdard', memberRef: memberId, postRef: id });
      post.likesCount += 1;
      await post.save();
      notifyPostUpdated(id, { likesCount: post.likesCount });
      return res.json({ success: true, likesCount: post.likesCount, isLiked: true });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.toggleBookmark = async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    const target = MOCK_POSTS.find(p => p._id === id);
    const isBookmarked = MOCK_BOOKMARKS.has(id);
    if (isBookmarked) {
      MOCK_BOOKMARKS.delete(id);
      if (target) target.bookmarksCount = Math.max(0, (target.bookmarksCount || 1) - 1);
    } else {
      MOCK_BOOKMARKS.add(id);
      if (target) target.bookmarksCount = (target.bookmarksCount || 0) + 1;
    }
    return res.json({ success: true, bookmarksCount: target ? target.bookmarksCount : 1, isBookmarked: !isBookmarked });
  }

  try {
    const memberId = await resolveMemberFromReq(req);

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const existingBookmark = await Bookmark.findOne({ memberRef: memberId, postRef: id });

    if (existingBookmark) {
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      post.bookmarksCount = Math.max(0, post.bookmarksCount - 1);
      await post.save();
      notifyPostUpdated(id, { bookmarksCount: post.bookmarksCount });
      return res.json({ success: true, bookmarksCount: post.bookmarksCount, isBookmarked: false });
    } else {
      await Bookmark.create({ communityId: 'gfg-jamia-hamdard', memberRef: memberId, postRef: id });
      post.bookmarksCount += 1;
      await post.save();
      notifyPostUpdated(id, { bookmarksCount: post.bookmarksCount });
      return res.json({ success: true, bookmarksCount: post.bookmarksCount, isBookmarked: true });
    }
  } catch (err) {
    console.error('Error toggling bookmark:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.getComments = async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      data: [
        {
          _id: 'c1',
          content: 'Great study notes! Super helpful for exam preparation.',
          createdAt: new Date('2026-07-29T11:00:00Z'),
          parentCommentId: null,
          authorRef: { name: 'Saquib Sarfaraz', photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80' },
          replies: [
            {
              _id: 'c1_sub1',
              content: 'Especially the BFS graph section!',
              createdAt: new Date('2026-07-29T11:10:00Z'),
              parentCommentId: 'c1',
              authorRef: { name: 'Aisha Khan', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80' }
            }
          ]
        }
      ]
    });
  }

  try {
    const comments = await Comment.find({ postId: id })
      .populate('authorRef', 'name photo role teamName')
      .sort({ createdAt: 1 })
      .lean();

    // Group into 2-level shallow tree
    const parentComments = comments.filter(c => !c.parentCommentId);
    const repliesMap = new Map();

    comments.forEach(c => {
      if (c.parentCommentId) {
        const parentId = c.parentCommentId.toString();
        if (!repliesMap.has(parentId)) {
          repliesMap.set(parentId, []);
        }
        repliesMap.get(parentId).push(c);
      }
    });

    const structuredComments = parentComments.map(p => ({
      ...p,
      replies: repliesMap.get(p._id.toString()) || []
    }));

    return res.json({ success: true, data: structuredComments });
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.addComment = async (req, res) => {
  const { id } = req.params;
  let { content, authorRef, parentCommentId } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const newComment = {
      _id: 'c_' + Date.now(),
      postId: id,
      content,
      parentCommentId: parentCommentId || null,
      createdAt: new Date(),
      authorRef: { name: 'Saquib Sarfaraz', photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80' },
      replies: []
    };
    const target = MOCK_POSTS.find(p => p._id === id);
    if (target) target.commentsCount = (target.commentsCount || 0) + 1;
    return res.status(201).json({ success: true, data: newComment });
  }

  try {
    if (!authorRef || !mongoose.Types.ObjectId.isValid(authorRef)) {
      authorRef = await getOrCreateDefaultMember();
    }

    const comment = await Comment.create({
      communityId: 'gfg-jamia-hamdard',
      postId: id,
      authorRef,
      content,
      parentCommentId: parentCommentId || null
    });

    const updatedPost = await Post.findByIdAndUpdate(id, { $inc: { commentsCount: 1 } }, { new: true });
    const populated = await Comment.findById(comment._id).populate('authorRef', 'name photo role teamName').lean();

    if (updatedPost) {
      notifyPostUpdated(id, { commentsCount: updatedPost.commentsCount });
    }

    return res.status(201).json({ success: true, data: { ...populated, replies: [] } });
  } catch (err) {
    console.error('Error adding comment:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const memberId = await resolveMemberFromReq(req);

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const post = await Post.findById(comment.postId);
    
    // Check permission: Comment Author OR Post Owner OR Moderator Permission
    const isCommentAuthor = memberId && comment.authorRef.toString() === memberId.toString();
    const isPostAuthor = memberId && post && post.authorRef.toString() === memberId.toString();
    const isModerator = req.user?.role === 'Super Admin' || req.adminAccess || (req.user?.permissions && req.user.permissions.includes('community:moderate'));

    if (!isCommentAuthor && !isPostAuthor && !isModerator) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this comment' });
    }

    // Check if comment has child replies
    const childRepliesCount = await Comment.countDocuments({ parentCommentId: commentId, isDeleted: false });

    if (childRepliesCount > 0) {
      // Soft deletion: preserve thread structure for replies
      comment.isDeleted = true;
      comment.content = '[Comment removed]';
      comment.deletedAt = new Date();
      comment.deletedBy = memberId || null;
      await comment.save();

      return res.json({ success: true, message: 'Comment removed', softDeleted: true });
    } else {
      // Hard deletion for leaf comment
      await Comment.findByIdAndDelete(commentId);
      if (post) {
        const updatedPost = await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } }, { new: true });
        if (updatedPost) {
          notifyPostUpdated(comment.postId, { commentsCount: updatedPost.commentsCount });
        }
      }
      return res.json({ success: true, message: 'Comment deleted successfully', softDeleted: false });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const memberId = await resolveMemberFromReq(req);
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // Check permission: Post Author OR Moderator Permission
    const isPostAuthor = memberId && String(post.authorRef) === String(memberId);
    const isModerator = req.user?.role === 'Super Admin' || req.adminAccess || (req.user?.permissions && req.user.permissions.includes('community:moderate'));

    if (!isPostAuthor && !isModerator) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
    }

    // 1. Capture Cloudinary assets from post.media[] with explicit publicId
    const assetsToDelete = (post.media || [])
      .filter(m => m && m.publicId && !m.publicId.startsWith('local_'))
      .map(m => ({ publicId: m.publicId, resourceType: m.resourceType || 'image' }));

    // 2. Perform DB deletion (MongoDB is source of truth)
    await Post.findByIdAndDelete(id);
    await Comment.deleteMany({ postId: id });
    await Like.deleteMany({ postRef: id });
    await Bookmark.deleteMany({ postRef: id });
    await Report.deleteMany({ targetRef: id });

    // 3. Non-blocking Cloudinary cleanup
    if (assetsToDelete.length > 0) {
      deleteAssets(assetsToDelete).catch(err => console.error('[PostDelete] Cloudinary cleanup async error:', err));
    }

    // 4. Audit Log
    if (req.user) {
      AuditLog.create({
        operatorRef: req.user._id,
        operatorRole: req.user.role || 'Member',
        action: 'POST_PERMANENT_DELETE',
        targetType: 'post',
        targetId: id,
        targetTitle: post.title || 'Untitled Post'
      }).catch(err => console.error('[AuditLog Error]:', err));
    }

    // 5. Notify Socket.io
    notifyPostUpdated(id, { isDeleted: true });

    return res.json({ success: true, deletedPostId: id, message: 'Post permanently deleted.' });
  } catch (err) {
    console.error('[DeletePost Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.togglePinPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.isPinned = !post.isPinned;
    await post.save();
    return res.json({ success: true, isPinned: post.isPinned });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
