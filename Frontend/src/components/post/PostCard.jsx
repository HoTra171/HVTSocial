import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { postApi } from '../../api/postApi';
import { commentApi } from '../../api/commentApi';
import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostMediaGrid from './PostMediaGrid';
import PostActions from './PostActions';
import PostCommentSection from './PostCommentSection';
import LikesModal from './LikesModal';
import ShareModal from '../ShareModal';

const parseImages = (raw) => {
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw === 'string') return raw.split(';').map((s) => s.trim()).filter(Boolean);
  return [];
};

export const PostCard = ({
  post,
  currentUser: propUser,
  initialShowComments = false,
  onPostDeleted,
  onPostUnsaved,
  onPostUnliked,
}) => {
  const { currentUser: authUser } = useAuth();
  const currentUser = authUser || propUser;

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post?.likes_count) || 0);
  const [saved, setSaved] = useState(false);

  const [showComments, setShowComments] = useState(initialShowComments);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(Number(post?.comments_count) || 0);

  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const postUser = post?.user || {};
  const isPostOwner = currentUser?.id && currentUser.id === postUser?.id;
  const images = parseImages(post?.image_urls || post?.media_url);

  // Đồng bộ props post
  useEffect(() => {
    setLikesCount(Number(post?.likes_count) || 0);
    setCommentsCount(Number(post?.comments_count) || 0);
  }, [post?.likes_count, post?.comments_count]);

  // Kiểm tra trạng thái đã Like / Lưu bài viết
  useEffect(() => {
    if (!currentUser?.id || !post?.id) return;
    let isMounted = true;
    postApi
      .checkLike(post.id)
      .then((res) => {
        if (isMounted) setLiked(Boolean(res.data?.liked));
      })
      .catch(() => {});
    postApi
      .checkSave(post.id)
      .then((res) => {
        if (isMounted) setSaved(Boolean(res.data?.saved));
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, post?.id]);

  // Tải trước bình luận nếu initialShowComments = true
  useEffect(() => {
    if (initialShowComments && post?.id && comments.length === 0) {
      setLoadingComments(true);
      commentApi
        .getByPostId(post.id)
        .then((res) => {
          const fetched = res.data?.data || res.data?.comments || res.data || [];
          setComments(Array.isArray(fetched) ? fetched : []);
        })
        .catch((err) => console.error('Lỗi khi tải bình luận:', err))
        .finally(() => setLoadingComments(false));
    }
  }, [initialShowComments, post?.id]);

  // Toggle Like
  const handleToggleLike = async () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    const prevLiked = liked;
    const prevCount = likesCount;

    // Optimistic UI update
    setLiked(!prevLiked);
    setLikesCount((prev) => (prevLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      await postApi.toggleLike(post.id);
      if (prevLiked && typeof onPostUnliked === 'function') {
        onPostUnliked(post.id);
      }
    } catch (err) {
      // Rollback nếu lỗi
      setLiked(prevLiked);
      setLikesCount(prevCount);
      console.error('Like post error:', err);
      toast.error('Không thể cập nhật lượt thích');
    }
  };

  // Toggle Save (Bookmark)
  const handleToggleSave = async () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để lưu bài viết');
      return;
    }

    const prevSaved = saved;
    setSaved(!prevSaved);

    try {
      await postApi.toggleSave(post.id);
      toast.success(prevSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết vào mục yêu thích');
      if (prevSaved && typeof onPostUnsaved === 'function') {
        onPostUnsaved(post.id);
      }
    } catch (err) {
      setSaved(prevSaved);
      console.error('Save post error:', err);
      toast.error('Không thể lưu bài viết');
    }
  };

  // Toggle xem danh sách bình luận
  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await commentApi.getByPostId(post.id);
        const fetched = res.data?.data || res.data?.comments || res.data || [];
        setComments(Array.isArray(fetched) ? fetched : []);
      } catch (err) {
        console.error('Lỗi khi tải bình luận:', err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Xóa bài viết
  const handleDeletePost = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;

    try {
      await postApi.delete(post.id);
      toast.success('Đã xóa bài viết thành công');
      onPostDeleted?.(post.id);
    } catch (err) {
      console.error('Delete post error:', err);
      toast.error('Không thể xóa bài viết');
    }
  };

  // Sao chép liên kết
  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard
      .writeText(postUrl)
      .then(() => toast.success('Đã sao chép liên kết bài viết!'))
      .catch(() => toast.error('Không thể sao chép liên kết'));
  };

  // Thêm bình luận mới vào danh sách
  const handleCommentAdded = (newComment) => {
    setComments((prev) => [newComment, ...prev]);
    setCommentsCount((prev) => prev + 1);
  };

  // Xóa bình luận khỏi danh sách
  const handleCommentDeleted = (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 transition-all hover:shadow-md">
      {/* 1. Header bài viết */}
      <PostHeader
        post={post}
        currentUser={currentUser}
        isPostOwner={isPostOwner}
        saved={saved}
        onDelete={handleDeletePost}
        onToggleSave={handleToggleSave}
        onCopyLink={handleCopyLink}
      />

      {/* 2. Nội dung text */}
      <PostContent content={post?.content} />

      {/* 3. Lưới hình ảnh / Media */}
      <PostMediaGrid images={images} />

      {/* 4. Thống kê & Nút hành động (Like, Comment, Share, Bookmark) */}
      <PostActions
        liked={liked}
        likesCount={likesCount}
        commentsCount={commentsCount}
        sharesCount={Number(post?.shares_count) || 0}
        saved={saved}
        onToggleLike={handleToggleLike}
        onShowLikesList={() => setShowLikesModal(true)}
        onToggleComments={handleToggleComments}
        onShare={() => setShowShareModal(true)}
        onToggleSave={handleToggleSave}
      />

      {/* 5. Khu vực bình luận (mở rộng khi click) */}
      {showComments && (
        <PostCommentSection
          postId={post.id}
          currentUser={currentUser}
          isPostOwner={isPostOwner}
          comments={comments}
          loadingComments={loadingComments}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      )}

      {/* Modal danh sách người thích */}
      <LikesModal
        isOpen={showLikesModal}
        onClose={() => setShowLikesModal(false)}
        postId={post.id}
      />

      {/* Modal chia sẻ */}
      {showShareModal && (
        <ShareModal
          post={post}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </article>
  );
};

export default PostCard;
