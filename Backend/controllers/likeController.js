import { LikeService } from "../services/likeService.js";

import { PostService } from "../services/postService.js";
import { emitNotification } from '../helpers/notificationHelper.js';

export const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    // Lưu like vào DB
    const result = await LikeService.likePost(userId, postId);

    // Lấy thông tin post để biết ai là owner
    const post = await PostService.getPostById(postId);

    // Tạo và emit notification
    if (req.app.get('io') && post.user_id !== userId) {
      await emitNotification(req.app.get('io'), {
        userId: post.user_id,  // Owner của post
        senderId: userId,       // Người like
        type: 'like',
        postId: postId,
      });
    }

    res.json({
      success: true,
      message: 'Đã thích bài viết',
      data: result,
    });
  } catch (err) {
    console.error('likePost error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/likes/post/:postId
export const togglePostLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = Number(req.params.postId);


    const result = await LikeService.togglePostLike(userId, postId);


    // Notification (ONLY when the toggle results in "liked")
    try {
      const io = req.app.get('io');
      if (io) {
        // determine whether this toggle ended up as "liked"
        let likedNow = null;

        if (result && typeof result === 'object') {
          // common shapes
          if (result.action) likedNow = String(result.action).toLowerCase() === 'liked';
          else if (typeof result.liked === 'boolean') likedNow = result.liked;
          else if (typeof result.isLiked === 'boolean') likedNow = result.isLiked;
          else if (result.data && typeof result.data === 'object') {
            if (result.data.action) likedNow = String(result.data.action).toLowerCase() === 'liked';
            else if (typeof result.data.liked === 'boolean') likedNow = result.data.liked;
            else if (typeof result.data.isLiked === 'boolean') likedNow = result.data.isLiked;
          }
        }

        // fallback: check DB state
        if (likedNow === null) {
          likedNow = await LikeService.checkUserLikedPost(userId, postId);
        }

        if (likedNow) {

          const post = await PostService.getPostById(postId);

          console.log("Đây là bài post của tôi: " + post);


          const postOwnerId = post?.user_id ?? post?.user?.id;

          if (!postOwnerId) {
            console.warn("[like] missing postOwnerId", { postId, post });
            return res.json({ success: true }); 
          }

          if (postOwnerId && postOwnerId !== userId) {
            await emitNotification(io, {
              userId: postOwnerId,
              senderId: userId,
              type: 'like',
              postId: postId,
            });
          }
        }
      }
    } catch (notifyErr) {
      console.error('togglePostLike notification error:', notifyErr);
    }
    res.json(result);
  } catch (err) {
    console.error("togglePostLike error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/likes/comment/:commentId
export const toggleCommentLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = Number(req.params.commentId);

    const result = await LikeService.toggleCommentLike(userId, commentId);

    res.json(result);
  } catch (err) {
    console.error("toggleCommentLike error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/likes/post/:postId
export const getPostLikes = async (req, res) => {
  try {
    const postId = Number(req.params.postId);

    const likes = await LikeService.getPostLikes(postId);

    res.json(likes);
  } catch (err) {
    console.error("getPostLikes error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/likes/check/:postId
export const checkUserLikedPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = Number(req.params.postId);

    const liked = await LikeService.checkUserLikedPost(userId, postId);

    res.json({ liked });
  } catch (err) {
    console.error("checkUserLikedPost error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// / GET /api/likes/posts
export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.user.id; // từ authMiddleware
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    const posts = await LikeService.getLikedPosts(userId, page, limit);

    res.json(posts);
  } catch (err) {
    console.error("getLikedPosts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
