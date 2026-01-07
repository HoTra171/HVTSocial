import { SavedPostService } from '../services/savedPostService.js';

// POST /api/saved-posts/:postId
export const toggleSavePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = Number(req.params.postId);

    const result = await SavedPostService.toggleSavePost(userId, postId);

    res.json(result);
  } catch (err) {
    console.error('toggleSavePost error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/saved-posts
export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const posts = await SavedPostService.getSavedPosts(userId, page, limit);

    res.json(posts);
  } catch (err) {
    console.error('getSavedPosts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/saved-posts/check/:postId
export const checkSavedPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = Number(req.params.postId);

    const saved = await SavedPostService.checkUserSavedPost(userId, postId);

    res.json({ saved });
  } catch (err) {
    console.error('checkSavedPost error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
