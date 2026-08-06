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
const { authMiddleware } = require('../middleware/auth');

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', createPost);
router.post('/:id/like', toggleLike);
router.post('/:id/bookmark', toggleBookmark);
router.get('/:id/comments', getComments);
router.post('/:id/comments', addComment);
router.delete('/comments/:commentId', deleteComment);
router.delete('/:postId/comments/:commentId', deleteComment);
router.delete('/:id', deletePost);
router.patch('/:id/pin', authMiddleware, togglePinPost);

module.exports = router;
