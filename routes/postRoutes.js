const express = require('express');
const router = express.Router();
const {
  getPosts,
  getPostById,
  createPost,
  toggleLike,
  toggleBookmark,
  getComments,
  addComment,
  deleteComment,
  deletePost,
  togglePinPost
} = require('../controllers/postController');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

router.get('/', optionalAuthMiddleware, getPosts);
router.get('/:id', optionalAuthMiddleware, getPostById);
router.post('/', authMiddleware, createPost);
router.post('/:id/like', authMiddleware, toggleLike);
router.post('/:id/bookmark', authMiddleware, toggleBookmark);
router.get('/:id/comments', getComments);
router.post('/:id/comments', authMiddleware, addComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);
router.delete('/:postId/comments/:commentId', authMiddleware, deleteComment);
router.delete('/:id', authMiddleware, deletePost);
router.patch('/:id/pin', authMiddleware, togglePinPost);

module.exports = router;
