import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import toast from 'react-hot-toast';
import { postApi } from '../../api/postApi';
import { commentApi } from '../../api/commentApi';
import FriendButton from '../FriendButton';

dayjs.extend(relativeTime);

const InstagramPostModal = ({ post, onClose, currentUser, onPostUpdated }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(post?.is_liked || false);
  const [likesCount, setLikesCount] = useState(post?.likes_count || 0);
  const [isSaved, setIsSaved] = useState(post?.is_saved || false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const images = post?.image_urls && post.image_urls.length > 0 ? post.image_urls : [];

  // Check like & save status and fetch comments
  useEffect(() => {
    if (!post?.id) return;

    let isMounted = true;

    // Check Like
    postApi
      .checkLike(post.id)
      .then((res) => {
        if (isMounted && res.data?.liked !== undefined) {
          setIsLiked(res.data.liked);
        }
      })
      .catch(() => {});

    // Check Save
    postApi
      .checkSave(post.id)
      .then((res) => {
        if (isMounted && res.data?.saved !== undefined) {
          setIsSaved(res.data.saved);
        }
      })
      .catch(() => {});

    // Fetch Comments
    setLoadingComments(true);
    commentApi
      .getByPostId(post.id)
      .then((res) => {
        if (!isMounted) return;
        const list = res.data?.comments || res.data?.data || res.data || [];
        setComments(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error('Fetch comments error:', err))
      .finally(() => {
        if (isMounted) setLoadingComments(false);
      });

    // Close modal on ESC key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [post?.id, onClose]);

  // Handle Like
  const handleToggleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await postApi.toggleLike(post.id);
      if (res.data?.success) {
        setIsLiked(res.data.liked);
        if (res.data.likes_count !== undefined) {
          setLikesCount(res.data.likes_count);
        }
      }
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error('Không thể thực hiện thao tác');
    }
  };

  // Handle Save
  const handleToggleSave = async () => {
    const prevSaved = isSaved;
    setIsSaved(!prevSaved);

    try {
      const res = await postApi.toggleSave(post.id);
      if (res.data?.success) {
        setIsSaved(res.data.saved);
        toast.success(res.data.saved ? 'Đã lưu bài viết' : 'Đã bỏ lưu bài viết');
      }
    } catch {
      setIsSaved(prevSaved);
      toast.error('Không thể lưu bài viết');
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await commentApi.create(post.id, { content: newComment.trim() });
      if (res.data?.success || res.status === 201 || res.status === 200) {
        const added = res.data?.comment || {
          id: Date.now(),
          content: newComment.trim(),
          created_at: new Date().toISOString(),
          user: {
            id: currentUser?.id,
            full_name: currentUser?.full_name || currentUser?.name,
            username: currentUser?.username,
            avatar: currentUser?.avatar || currentUser?.profile_picture,
          },
        };
        setComments((prev) => [added, ...prev]);
        setNewComment('');
        toast.success('Đã gửi bình luận');
      }
    } catch (err) {
      console.error('Add comment error:', err);
      toast.error(err.response?.data?.message || 'Không thể gửi bình luận');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!post) return null;

  const author = post.user || {};
  const authorAvatar = author.avatar || author.profile_picture || '/default.jpg';
  const authorName = author.full_name || author.name || 'Người dùng';
  const authorUsername = author.username || '';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] border border-slate-200"
      >
        {/* LEFT COLUMN: POST MEDIA (CAROUSEL) */}
        <div className="md:w-7/12 bg-black flex items-center justify-center relative select-none min-h-[300px] md:min-h-[580px] overflow-hidden">
          {images.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={images[currentImageIndex]}
                alt="Post Media"
                className="max-h-[75vh] w-full object-contain"
              />

              {/* Prev / Next controls */}
              {images.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => prev - 1);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white text-slate-800 shadow-lg transition active:scale-95 cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {currentImageIndex < images.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => prev + 1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white text-slate-800 shadow-lg transition active:scale-95 cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Indicator dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-xs">
                    {images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-white/80">
              <p className="text-sm font-medium">{post.content || 'Bài viết văn bản'}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AUTHOR, COMMENTS & ACTIONS */}
        <div className="md:w-5/12 flex flex-col bg-white h-[450px] md:h-[580px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <Link
              to={`/profile/${author.id}`}
              className="flex items-center gap-3 group"
              onClick={onClose}
            >
              {/* Instagram Story Gradient Ring */}
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex-shrink-0">
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-9 h-9 rounded-full object-cover border-2 border-white"
                />
              </div>
              <div className="leading-tight">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1">
                  <span>{authorName}</span>
                </h4>
                {authorUsername && (
                  <p className="text-[11px] text-slate-500 font-medium">@{authorUsername}</p>
                )}
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {currentUser?.id !== author.id && (
                <FriendButton
                  userId={author.id}
                  currentUserId={currentUser?.id}
                  fullWidth={false}
                />
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Comments & Caption Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
            {/* Post Caption as first comment */}
            {post.content && (
              <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                <Link to={`/profile/${author.id}`} onClick={onClose} className="flex-shrink-0">
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                </Link>
                <div className="flex-1">
                  <p className="text-slate-800 leading-relaxed">
                    <Link
                      to={`/profile/${author.id}`}
                      onClick={onClose}
                      className="font-bold text-slate-900 mr-1.5 hover:underline"
                    >
                      {authorUsername || authorName}
                    </Link>
                    {post.content}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {dayjs(post.createdAt || post.created_at).fromNow()}
                  </p>
                </div>
              </div>
            )}

            {/* Comments List */}
            {loadingComments ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((c) => {
                  const cUser = c.user || {};
                  return (
                    <div key={c.id || Math.random()} className="flex items-start gap-2.5">
                      <Link
                        to={`/profile/${cUser.id}`}
                        onClick={onClose}
                        className="flex-shrink-0 mt-0.5"
                      >
                        <img
                          src={cUser.avatar || cUser.profile_picture || '/default.jpg'}
                          alt={cUser.full_name || 'avatar'}
                          className="w-7 h-7 rounded-full object-cover border border-slate-100"
                        />
                      </Link>
                      <div className="flex-1">
                        <p className="text-slate-800 leading-snug">
                          <Link
                            to={`/profile/${cUser.id}`}
                            onClick={onClose}
                            className="font-semibold text-slate-900 mr-1.5 hover:underline"
                          >
                            {cUser.username || cUser.full_name || 'Người dùng'}
                          </Link>
                          <span>{c.content}</span>
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {dayjs(c.created_at || c.createdAt).fromNow()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="border-t border-slate-100 px-4 pt-3 pb-2 bg-slate-50/40 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className="p-1 text-slate-700 hover:text-red-500 active:scale-125 transition cursor-pointer"
                  title="Thích"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isLiked ? 'fill-red-500 text-red-500 animate-in zoom-in-75' : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  className="p-1 text-slate-700 hover:text-indigo-600 transition cursor-pointer"
                  title="Bình luận"
                >
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.origin + `/posts/${post.id}`);
                    toast.success('Đã sao chép liên kết bài viết');
                  }}
                  className="p-1 text-slate-700 hover:text-indigo-600 transition cursor-pointer"
                  title="Chia sẻ"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleToggleSave}
                className="p-1 text-slate-700 hover:text-amber-500 transition cursor-pointer"
                title="Lưu"
              >
                <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
              </button>
            </div>

            <div className="text-xs font-bold text-slate-900 mb-1">
              {likesCount.toLocaleString()} lượt thích
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              {dayjs(post.createdAt || post.created_at).fromNow()}
            </div>
          </div>

          {/* Add Comment Input Bar */}
          <form
            onSubmit={handleAddComment}
            className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0"
          >
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Thêm bình luận..."
              disabled={submittingComment}
              className="flex-1 text-xs sm:text-sm bg-transparent outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submittingComment}
              className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Đăng
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InstagramPostModal;
