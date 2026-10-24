import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Trash2, AlertCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';
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
import PostPoll from './PostPoll';
import EditPostModal from './EditPostModal';
import FacebookPostCommentModal from './FacebookPostCommentModal';

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
  onPostUpdated,
  onPostUnsaved,
  onPostUnliked,
  onRetryUpload,
  onCancelUpload,
}) => {
  const { currentUser: authUser } = useAuth();
  const currentUser = authUser || propUser;

  const [currentPost, setCurrentPost] = useState(post);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post?.likes_count) || 0);
  const [saved, setSaved] = useState(false);

  const [showComments, setShowComments] = useState(initialShowComments);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(Number(post?.comments_count) || 0);
  const [commentSortMode, setCommentSortMode] = useState('newest'); // 'newest' | 'relevant'
  const [showFacebookModal, setShowFacebookModal] = useState(false);

  const [showLikesModal, setShowLikesModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Đồng bộ props post khi thay đổi từ bên ngoài
  useEffect(() => {
    setCurrentPost(post);
    setLikesCount(Number(post?.likes_count) || 0);
    setCommentsCount(Number(post?.comments_count) || 0);
  }, [post]);

  const isUploading = Boolean(currentPost?.isUploading);
  const uploadFailed = Boolean(currentPost?.uploadFailed);

  const postUser = currentPost?.user || {};
  const isPostOwner = Boolean(
    currentUser?.id &&
    postUser?.id &&
    Number(currentUser.id) === Number(postUser.id)
  );
  const images = parseImages(currentPost?.image_urls || currentPost?.media_url);

  // Kiểm tra trạng thái đã Like / Lưu bài viết (bỏ qua nếu đang upload)
  useEffect(() => {
    if (!currentUser?.id || !currentPost?.id || isUploading) return;
    let isMounted = true;
    postApi
      .checkLike(currentPost.id)
      .then((res) => {
        if (isMounted) setLiked(Boolean(res.data?.liked));
      })
      .catch(() => {});
    postApi
      .checkSave(currentPost.id)
      .then((res) => {
        if (isMounted) setSaved(Boolean(res.data?.saved));
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, currentPost?.id, isUploading]);

  // Tải bình luận với chế độ sắp xếp (mặc định 'newest' để hiện ngay bình luận của bạn)
  const fetchComments = async (sort = commentSortMode) => {
    if (!currentPost?.id || isUploading) return;
    setLoadingComments(true);
    try {
      const res = await commentApi.getByPostId(currentPost.id, { sort });
      const fetched = res.data?.data || res.data?.comments || res.data || [];
      setComments(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error('Lỗi khi tải bình luận:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Tải trước bình luận nếu initialShowComments = true
  useEffect(() => {
    if (initialShowComments && currentPost?.id && !isUploading) {
      fetchComments(commentSortMode);
    }
  }, [initialShowComments, currentPost?.id, isUploading]);

  // Toggle Like
  const handleToggleLike = async () => {
    if (isUploading) return;
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
      await postApi.toggleLike(currentPost.id);
      if (prevLiked && typeof onPostUnliked === 'function') {
        onPostUnliked(currentPost.id);
      }
    } catch (err) {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      console.error('Like post error:', err);
      toast.error('Không thể cập nhật lượt thích');
    }
  };

  // Toggle Save (Bookmark)
  const handleToggleSave = async () => {
    if (isUploading) return;
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để lưu bài viết');
      return;
    }

    const prevSaved = saved;
    setSaved(!prevSaved);

    try {
      await postApi.toggleSave(currentPost.id);
      toast.success(prevSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết vào mục yêu thích');
      if (prevSaved && typeof onPostUnsaved === 'function') {
        onPostUnsaved(currentPost.id);
      }
    } catch (err) {
      setSaved(prevSaved);
      console.error('Save post error:', err);
      toast.error('Không thể lưu bài viết');
    }
  };

  // Toggle xem danh sách bình luận
  const handleToggleComments = async () => {
    if (isUploading) return;
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState) {
      fetchComments(commentSortMode);
    }
  };

  // Đổi chế độ sắp xếp bình luận (Phù hợp nhất vs Tất cả bình luận)
  const handleSortChange = (newSort) => {
    setCommentSortMode(newSort);
    fetchComments(newSort);
  };

  // Xử lý khi bài viết được cập nhật từ modal chỉnh sửa
  const handlePostUpdated = (updatedPost) => {
    setCurrentPost((prev) => ({
      ...prev,
      ...updatedPost,
    }));
    setShowEditModal(false);
    onPostUpdated?.(updatedPost);
  };

  // Xác nhận xóa bài viết
  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await postApi.delete(currentPost.id);
      toast.success('Đã xóa bài viết thành công');
      setShowDeleteModal(false);
      onPostDeleted?.(currentPost.id);
    } catch (err) {
      console.error('Delete post error:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa bài viết, vui lòng thử lại');
    } finally {
      setDeleting(false);
    }
  };

  // Sao chép liên kết
  const handleCopyLink = () => {
    if (isUploading) return;
    const postUrl = `${window.location.origin}/post/${currentPost.id}`;
    navigator.clipboard
      .writeText(postUrl)
      .then(() => toast.success('Đã sao chép liên kết bài viết!'))
      .catch(() => toast.error('Không thể sao chép liên kết'));
  };

  // Thêm bình luận mới vào danh sách
  const handleCommentAdded = (newComment) => {
    const parentId = newComment?.comment_parent || newComment?.parent_comment_id;
    if (!parentId) {
      setComments((prev) => [newComment, ...prev]);
    } else {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? {
                ...c,
                replies_count: (Number(c.replies_count) || 0) + 1,
                replies: c.replies ? [...c.replies, newComment] : [newComment],
              }
            : c
        )
      );
    }
    setCommentsCount((prev) => prev + 1);
  };

  // Xóa bình luận khỏi danh sách
  const handleCommentDeleted = (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <>
      <article className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-5 transition-all duration-200 hover:shadow-md relative ${
        isUploading ? 'ring-2 ring-indigo-500/30' : ''
      }`}>
        {/* THANH TRẠNG THÁI UPLOAD NỀN (FACEBOOK / INSTAGRAM STYLE) */}
        {isUploading && (
          <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border-b border-indigo-100 dark:border-indigo-900/50 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                Đang đăng bài viết lên bảng tin...
              </span>
            </div>
            <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* CẢNH BÁO UPLOAD LỖI */}
        {uploadFailed && (
          <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-900/50 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Đăng bài không thành công</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRetryUpload?.(currentPost)}
                className="px-2.5 py-1 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Thử lại
              </button>
              <button
                type="button"
                onClick={() => onCancelUpload?.(currentPost.id)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 1. Header bài viết */}
        <PostHeader
          post={currentPost}
          currentUser={currentUser}
          isPostOwner={isPostOwner}
          saved={saved}
          onEdit={() => setShowEditModal(true)}
          onDelete={() => setShowDeleteModal(true)}
          onToggleSave={handleToggleSave}
          onCopyLink={handleCopyLink}
        />

        {/* 2. Nội dung text */}
        <PostContent content={currentPost?.content} />

        {/* 2.5. Thăm dò ý kiến (Poll) nếu có */}
        {currentPost?.poll && (
          <PostPoll
            poll={currentPost.poll}
            postId={currentPost.id}
            currentUser={currentUser}
          />
        )}

        {/* 3. Lưới hình ảnh / Media */}
        <PostMediaGrid images={images} onDoubleTapLike={handleToggleLike} />

        {/* 4. Thống kê & Nút hành động (Like, Comment, Share, Bookmark) */}
        <PostActions
          liked={liked}
          likesCount={likesCount}
          commentsCount={commentsCount}
          sharesCount={Number(currentPost?.shares_count) || 0}
          saved={saved}
          onToggleLike={handleToggleLike}
          onShowLikesList={() => !isUploading && setShowLikesModal(true)}
          onToggleComments={handleToggleComments}
          onShare={() => !isUploading && setShowShareModal(true)}
          onToggleSave={handleToggleSave}
          disabled={isUploading}
        />

        {/* 5. Khu vực bình luận (mở rộng khi click) */}
        {showComments && !isUploading && (
          <PostCommentSection
            postId={currentPost.id}
            currentUser={currentUser}
            isPostOwner={isPostOwner}
            comments={comments}
            loadingComments={loadingComments}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
            sortMode={commentSortMode}
            onSortChange={handleSortChange}
            onOpenModal={() => setShowFacebookModal(true)}
          />
        )}

        {/* Modal danh sách người thích */}
        {showLikesModal && (
          <LikesModal
            isOpen={showLikesModal}
            onClose={() => setShowLikesModal(false)}
            postId={currentPost.id}
          />
        )}

        {/* Modal chia sẻ */}
        {showShareModal && (
          <ShareModal
            post={currentPost}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </article>

      {/* MODAL CHỈNH SỬA BÀI VIẾT */}
      {showEditModal && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          post={currentPost}
          onPostUpdated={handlePostUpdated}
        />
      )}

      {/* MODAL XÁC NHẬN XÓA BÀI VIẾT (MODERN CONFIRMATION MODAL) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Xóa bài viết?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hành động này không thể hoàn tác
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn không? Mọi lượt thích, bình luận và nội dung đính kèm sẽ bị xóa khỏi hệ thống.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa vĩnh viễn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRANG BÌNH LUẬN RIÊNG CHUẨN FACEBOOK */}
      {showFacebookModal && (
        <FacebookPostCommentModal
          post={currentPost}
          isOpen={showFacebookModal}
          onClose={() => setShowFacebookModal(false)}
          currentUser={currentUser}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </>
  );
};

export default PostCard;
