import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Image as ImageIcon,
  Loader2,
  CornerDownRight,
  ChevronDown,
  Sparkles,
  Clock,
  RefreshCw,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import toast from 'react-hot-toast';
import { postApi } from '../../api/postApi';
import { commentApi } from '../../api/commentApi';
import { uploadApi } from '../../api/uploadApi';
import FriendButton from '../FriendButton';
import PostCommentSection from './PostCommentSection';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const safeFromNow = (d) => {
  if (!d) return '';
  try {
    return dayjs(d).fromNow();
  } catch {
    return '';
  }
};

const REACTIONS = [
  { id: 'like', emoji: '👍', label: 'Thích', color: 'text-blue-600' },
  { id: 'love', emoji: '❤️', label: 'Yêu thích', color: 'text-rose-500' },
  { id: 'care', emoji: '🥰', label: 'Thương thương', color: 'text-amber-500' },
  { id: 'haha', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
  { id: 'wow', emoji: '😮', label: 'Wow', color: 'text-amber-500' },
  { id: 'sad', emoji: '😢', label: 'Buồn', color: 'text-indigo-400' },
  { id: 'angry', emoji: '😡', label: 'Phẫn nộ', color: 'text-orange-600' },
];

const parseImages = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    return raw
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const FacebookPostCommentModal = ({
  post,
  isOpen,
  onClose,
  currentUser,
  onPostUpdated,
}) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(post?.is_liked || false);
  const [likesCount, setLikesCount] = useState(Number(post?.likes_count) || 0);
  const [saved, setSaved] = useState(post?.is_saved || false);
  const [commentsCount, setCommentsCount] = useState(Number(post?.comments_count) || 0);

  // 2 CHẾ ĐỘ BÌNH LUẬN CHUẨN FACEBOOK
  // 'newest' = Tất cả bình luận (Mới nhất) | 'relevant' = Phù hợp nhất
  const [sortMode, setSortMode] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Reaction popover state
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(post?.is_liked ? REACTIONS[1] : null);
  const reactionTimerRef = useRef(null);

  const images = parseImages(post?.image_urls || post?.media_url);

  // Fetch comments with sort mode
  const fetchComments = async (mode = sortMode) => {
    if (!post?.id) return;
    setLoadingComments(true);
    try {
      const res = await commentApi.getByPostId(post.id, { sort: mode });
      const list = res.data?.data || res.data?.comments || res.data || [];
      setComments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !post?.id) return;

    setCurrentImageIndex(0);
    setLiked(Boolean(post.is_liked));
    setLikesCount(Number(post.likes_count) || 0);
    setCommentsCount(Number(post.comments_count) || 0);

    fetchComments(sortMode);

    // ESC to close
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, post?.id]);

  if (!isOpen || !post) return null;

  const author = post.user || {};
  const authorAvatar = author.avatar || author.profile_picture || '/default.jpg';
  const authorName = author.full_name || author.name || 'Người dùng';
  const authorUsername = author.username || '';

  // Toggle Like
  const handleToggleLike = async () => {
    const prevLiked = liked;
    const prevCount = likesCount;

    setLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      await postApi.toggleLike(post.id);
      onPostUpdated?.({
        ...post,
        is_liked: !prevLiked,
        likes_count: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
      });
    } catch (err) {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error('Không thể cập nhật lượt thích');
    }
  };

  // Toggle Save
  const handleToggleSave = async () => {
    const prevSaved = saved;
    setSaved(!prevSaved);
    try {
      await postApi.toggleSave(post.id);
      toast.success(prevSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết');
    } catch (err) {
      setSaved(prevSaved);
      toast.error('Không thể lưu bài viết');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('Đã sao chép liên kết bài viết!'))
      .catch(() => toast.error('Không thể sao chép liên kết'));
  };

  const handleSwitchSort = (mode) => {
    setSortMode(mode);
    setShowSortDropdown(false);
    fetchComments(mode);
  };

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

  const handleCommentDeleted = (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-0 md:p-4 lg:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl h-full md:h-[92vh] bg-white dark:bg-slate-900 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800"
      >
        {/* =========================================
            CỘT TRÁI: THEATER MEDIA (FACEBOOK STYLE)
            ========================================= */}
        <div className="md:w-7/12 bg-black flex flex-col justify-between relative select-none min-h-[280px] md:min-h-full overflow-hidden">
          {/* Top Actions in Theater */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition cursor-pointer md:hidden"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Chế độ rạp phim Facebook</span>
            </span>
          </div>

          {/* Media Container */}
          <div className="flex-1 flex items-center justify-center relative w-full h-full min-h-[260px]">
            {images.length > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={images[currentImageIndex]}
                  alt="Post Media"
                  className="max-h-[60vh] md:max-h-[85vh] w-full object-contain"
                />

                {/* Prev / Next Buttons */}
                {images.length > 1 && (
                  <>
                    {currentImageIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex((p) => p - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                    )}
                    {currentImageIndex < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex((p) => p + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md shadow-lg transition active:scale-95 cursor-pointer"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    )}

                    {/* Indicator dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md">
                      {images.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 rounded-full transition-all ${
                            idx === currentImageIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-8 max-w-md text-center text-white/90">
                <p className="text-base sm:text-lg font-medium leading-relaxed italic">
                  "{post.content || 'Bài viết văn bản'}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =========================================
            CỘT PHẢI: TRANG BÌNH LUẬN RIÊNG (FACEBOOK STYLE)
            ========================================= */}
        <div className="md:w-5/12 flex flex-col bg-white dark:bg-slate-900 h-full flex-1 min-w-0">
          {/* 1. Header tác giả */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <Link
              to={`/profile/${author.id}`}
              className="flex items-center gap-3 group min-w-0"
              onClick={onClose}
            >
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = '/default.jpg';
                }}
              />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition">
                  {authorName}
                </h4>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>{safeFromNow(post.created_at || post.createdAt)}</span>
                  <span>•</span>
                  <span>{post.status === 'private' ? 'Chỉ mình tôi' : 'Công khai'}</span>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate(`/post/${post.id}`)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                title="Mở toàn trang riêng"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                title="Đóng (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Thân nội dung bài viết & Thanh tương tác nhanh */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex-shrink-0">
            {post.content && (
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto pr-1">
                {post.content}
              </p>
            )}

            {/* Thống kê tương tác */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1 font-medium">
                <span className="text-rose-500">❤️</span>
                <span>{likesCount} người thích</span>
              </span>
              <span>{commentsCount} bình luận</span>
            </div>

            {/* Nút Like / Share nhanh */}
            <div className="grid grid-cols-3 gap-2 pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={handleToggleLike}
                className={`py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition ${
                  liked
                    ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
                <span>{liked ? 'Đã thích' : 'Thích'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="py-1.5 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-4 h-4" />
                <span>Chia sẻ</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSave}
                className={`py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition ${
                  saved
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${saved ? 'fill-indigo-600' : ''}`} />
                <span>{saved ? 'Đã lưu' : 'Lưu'}</span>
              </button>
            </div>
          </div>

          {/* 3. THANH CHỌN 2 CHẾ ĐỘ BÌNH LUẬN (CHUẨN FACEBOOK) */}
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs flex-shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSortDropdown((prev) => !prev)}
                className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 transition cursor-pointer"
              >
                {sortMode === 'newest' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Tất cả bình luận (Mới nhất)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Phù hợp nhất</span>
                  </>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showSortDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu 2 chế độ */}
              {showSortDropdown && (
                <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-1.5 z-30 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => handleSwitchSort('newest')}
                    className={`w-full text-left p-2.5 rounded-xl flex items-start gap-2.5 transition cursor-pointer ${
                      sortMode === 'newest'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Clock className="w-4 h-4 mt-0.5 text-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Tất cả bình luận (Mới nhất)</p>
                      <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                        Xem mọi bình luận theo thứ tự thời gian mới nhất (thấy ngay bình luận của bạn).
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchSort('relevant')}
                    className={`w-full text-left p-2.5 rounded-xl flex items-start gap-2.5 transition cursor-pointer mt-1 ${
                      sortMode === 'relevant'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Phù hợp nhất</p>
                      <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                        Ưu tiên hiển thị bình luận có nhiều lượt thích và nhiều phản hồi nhất.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Nút làm mới danh sách */}
            <button
              type="button"
              onClick={() => fetchComments(sortMode)}
              disabled={loadingComments}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              title="Làm mới bình luận"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingComments ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>

          {/* 4. KHUNG BÌNH LUẬN ĐẦY ĐỦ (CUỘN RIÊNG) */}
          <div className="flex-1 overflow-y-auto">
            <PostCommentSection
              postId={post.id}
              currentUser={currentUser}
              isPostOwner={currentUser?.id === author?.id}
              comments={comments}
              loadingComments={loadingComments}
              onCommentAdded={handleCommentAdded}
              onCommentDeleted={handleCommentDeleted}
              hideQuickSortBar={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacebookPostCommentModal;
