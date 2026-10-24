import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Heart,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  ChevronDown,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { useAuth } from '../contexts/AuthContext';
import { postApi } from '../api/postApi';
import { commentApi } from '../api/commentApi';
import { PostSkeleton } from '../components/common/SkeletonLoader';
import PostCommentSection from '../components/post/PostCommentSection';
import FriendButton from '../components/FriendButton';

dayjs.extend(relativeTime);
dayjs.locale('vi');

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

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // Media carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Likes & saves
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saved, setSaved] = useState(false);

  // 2 CHẾ ĐỘ BÌNH LUẬN CHUẨN FACEBOOK
  // 'newest' = Tất cả bình luận (Mới nhất) | 'relevant' = Phù hợp nhất
  const [sortMode, setSortMode] = useState('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchComments = async (mode = sortMode) => {
    if (!postId) return;
    setLoadingComments(true);
    try {
      const res = await commentApi.getByPostId(postId, { sort: mode });
      const list = res.data?.data || res.data?.comments || res.data || [];
      setComments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Fetch comments error in PostDetail:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await postApi.getById(postId);
        const data = res.data?.data || res.data?.post || res.data;
        if (isMounted && data) {
          setPost(data);
          setLiked(Boolean(data.is_liked));
          setLikesCount(Number(data.likes_count) || 0);
          setSaved(Boolean(data.is_saved));
          setCommentsCount(Number(data.comments_count) || 0);
        }
      } catch (err) {
        console.error('Fetch post detail error:', err);
        toast.error('Không tìm thấy bài viết hoặc bài viết đã bị xóa');
        if (isMounted) {
          navigate('/feed', { replace: true });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (postId) {
      fetchPost();
      fetchComments(sortMode);
    }

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleToggleLike = async () => {
    if (!post) return;
    const prevLiked = liked;
    const prevCount = likesCount;

    setLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      await postApi.toggleLike(post.id);
    } catch (err) {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error('Không thể cập nhật lượt thích');
    }
  };

  const handleToggleSave = async () => {
    if (!post) return;
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

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(window.location.href)
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

  const images = parseImages(post?.image_urls || post?.media_url);
  const author = post?.user || {};
  const authorAvatar = author.avatar || author.profile_picture || '/default.jpg';
  const authorName = author.full_name || author.name || 'Người dùng';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              aria-label="Quay lại"
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              Trang bài viết & bình luận
            </h1>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sao chép liên kết</span>
          </button>
        </div>
      </header>

      {/* Main 2-Column Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex items-center justify-center">
        {loading ? (
          <div className="w-full max-w-2xl">
            <PostSkeleton />
          </div>
        ) : post ? (
          <div className="w-full h-full min-h-[580px] bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row">
            {/* CỘT TRÁI: RẠP PHIM MEDIA (FACEBOOK STYLE) */}
            <div className="md:w-7/12 bg-black flex flex-col justify-between relative select-none min-h-[300px] md:min-h-[620px] overflow-hidden">
              <div className="flex-1 flex items-center justify-center relative w-full h-full min-h-[280px]">
                {images.length > 0 ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={images[currentImageIndex]}
                      alt="Post Media"
                      className="max-h-[75vh] w-full object-contain"
                    />

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
                    <p className="text-lg font-medium leading-relaxed italic">
                      "{post.content || 'Bài viết văn bản'}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CỘT PHẢI: TRANG BÌNH LUẬN RIÊNG BIỆT (FACEBOOK STYLE) */}
            <div className="md:w-5/12 flex flex-col bg-white dark:bg-slate-900 h-full flex-1 min-w-0">
              {/* 1. Header tác giả */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <Link
                  to={`/profile/${author.id}`}
                  className="flex items-center gap-3 group min-w-0"
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
                      <span>{dayjs(post.created_at || post.createdAt).fromNow()}</span>
                      <span>•</span>
                      <span>{post.status === 'private' ? 'Chỉ mình tôi' : 'Công khai'}</span>
                    </div>
                  </div>
                </Link>

                {currentUser?.id !== author.id && (
                  <FriendButton
                    userId={author.id}
                    currentUserId={currentUser?.id}
                    fullWidth={false}
                  />
                )}
              </div>

              {/* 2. Thân nội dung & Nút tương tác */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex-shrink-0">
                {post.content && (
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto pr-1">
                    {post.content}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="text-rose-500">❤️</span>
                    <span>{likesCount} người thích</span>
                  </span>
                  <span>{commentsCount} bình luận</span>
                </div>

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
                    onClick={handleCopyLink}
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

              {/* 3. THANH CHỌN 2 CHẾ ĐỘ BÌNH LUẬN (FACEBOOK STYLE) */}
              <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs flex-shrink-0">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSortDropdown((p) => !p)}
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

                  {showSortDropdown && (
                    <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-1.5 z-30 animate-in fade-in">
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

              {/* 4. Khung bình luận cuộn độc lập */}
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
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
            <p className="text-slate-500 font-medium">Không tìm thấy nội dung bài viết</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PostDetail;
