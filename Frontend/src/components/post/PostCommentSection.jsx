import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  MoreHorizontal,
  Edit,
  Trash2,
  Image as ImageIcon,
  X,
  CornerDownRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Clock,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { commentApi } from '../../api/commentApi';
import { uploadApi } from '../../api/uploadApi';

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

const pickAvatar = (u) => u?.profile_picture || u?.avatar || u?.photo || '/default.jpg';
const pickName = (u) => u?.full_name || u?.name || u?.username || 'Người dùng';

function CommentItem({
  comment,
  currentUser,
  isPostOwner,
  onDeleted,
  onReply,
  isReply = false,
  postId,
}) {
  const commentUser = comment?.user || {};
  const isOwner = currentUser?.id && (currentUser.id === comment.user_id || currentUser.id === commentUser?.id);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content || '');
  const [editValue, setEditValue] = useState(comment.content || '');
  const [savingEdit, setSavingEdit] = useState(false);

  // Reply threads state
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [repliesCount, setRepliesCount] = useState(Number(comment.replies_count || 0));

  useEffect(() => {
    setContent(comment.content || '');
    setEditValue(comment.content || '');
    if (comment.replies_count !== undefined) {
      setRepliesCount(Number(comment.replies_count || 0));
    }
    if (Array.isArray(comment.replies) && comment.replies.length > 0) {
      setReplies(comment.replies);
      setShowReplies(true);
    }
  }, [comment.content, comment.replies_count, comment.replies]);

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await commentApi.delete(comment.id);
      toast.success('Đã xóa bình luận');
      onDeleted?.(comment.id);
    } catch (err) {
      console.error('Delete comment error:', err);
      toast.error('Không thể xóa bình luận');
    }
  };

  const handleSaveEdit = async () => {
    const text = editValue.trim();
    if (!text || savingEdit) return;

    setSavingEdit(true);
    try {
      await commentApi.update(comment.id, { content: text });
      setContent(text);
      setIsEditing(false);
      setShowMenu(false);
      toast.success('Đã cập nhật bình luận');
    } catch (err) {
      console.error('Edit comment error:', err);
      toast.error('Không thể cập nhật bình luận');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    setShowReplies(true);
    if (replies.length === 0) {
      setLoadingReplies(true);
      try {
        const res = await commentApi.getReplies(comment.id);
        const list = res.data?.data || res.data?.replies || res.data || [];
        setReplies(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Fetch replies error:', err);
      } finally {
        setLoadingReplies(false);
      }
    }
  };

  const handleReplyDeleted = (replyId) => {
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
    setRepliesCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-2.5 group">
        <img
          src={pickAvatar(commentUser)}
          alt=""
          className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700`}
          onError={(e) => {
            e.currentTarget.src = '/default.jpg';
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-3.5 py-2 relative inline-block max-w-full border border-transparent dark:border-slate-700/60 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-xs text-slate-900 dark:text-slate-100 leading-tight">
                  {pickName(commentUser)}
                </p>

                {isEditing ? (
                  <div className="mt-1 space-y-1.5">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={2}
                      className="w-full p-2 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                        className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-2.5 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {content && (
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 break-words mt-0.5 whitespace-pre-wrap leading-relaxed">
                        {content}
                      </p>
                    )}

                    {/* Image Attachment in Comment */}
                    {comment.image_url && (
                      <div className="mt-2 rounded-xl overflow-hidden max-w-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <img
                          src={comment.image_url}
                          alt="Ảnh đính kèm"
                          className="w-full max-h-56 object-cover cursor-pointer hover:opacity-95 transition"
                          onClick={() => window.open(comment.image_url, '_blank')}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Menu options */}
              {(isOwner || isPostOwner) && !isEditing && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu((prev) => !prev)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-10 text-xs">
                      {isOwner && (
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left transition"
                        >
                          <Edit className="w-3 h-3 text-indigo-500" />
                          Sửa
                        </button>
                      )}
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-left transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Row: Time & Reply */}
          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mt-1 ml-2 font-medium">
            <span>{safeFromNow(comment.created_at || comment.createdAt)}</span>
            <button
              type="button"
              onClick={() => onReply?.(comment)}
              className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer"
            >
              Trả lời
            </button>
          </div>

          {/* Nested Replies Toggle */}
          {!isReply && (repliesCount > 0 || replies.length > 0) && (
            <div className="mt-1.5 ml-2">
              <button
                type="button"
                onClick={handleToggleReplies}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer"
              >
                <CornerDownRight size={13} />
                <span>
                  {showReplies
                    ? 'Ẩn câu trả lời'
                    : `Xem ${repliesCount || replies.length} câu trả lời`}
                </span>
                {loadingReplies && <Loader2 size={12} className="animate-spin ml-1" />}
              </button>

              {/* Nested Replies List */}
              {showReplies && (
                <div className="mt-2.5 space-y-2.5 pl-3 border-l-2 border-indigo-100 dark:border-indigo-950/60">
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUser={currentUser}
                      isPostOwner={isPostOwner}
                      onDeleted={handleReplyDeleted}
                      onReply={() => onReply?.(comment, reply)}
                      isReply={true}
                      postId={postId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const PostCommentSection = ({
  postId,
  currentUser,
  isPostOwner,
  comments = [],
  loadingComments,
  onCommentAdded,
  onCommentDeleted,
  sortMode = 'newest',
  onSortChange,
  onOpenModal,
  hideQuickSortBar = false,
}) => {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id, name, username }
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Image upload in comment state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const handleStartReply = (parentComment, targetUser = null) => {
    const target = targetUser || parentComment;
    const targetName = pickName(target?.user || target);
    setReplyingTo({
      commentId: parentComment.id,
      name: targetName,
    });
    // Auto focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn định dạng ảnh hợp lệ');
        return;
      }
      setImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if ((!text && !imageFile) || submitting) return;

    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload ảnh nếu có
      let uploadedImageUrl = null;
      if (imageFile) {
        const uploadRes = await uploadApi.uploadFile(imageFile);
        uploadedImageUrl = uploadRes.data?.url || uploadRes.data?.data?.url;
      }

      // 2. Gửi bình luận
      const res = await commentApi.create(postId, {
        content: text,
        image_url: uploadedImageUrl,
        comment_parent: replyingTo?.commentId || null,
      });

      const newComment = res.data?.data || res.data?.comment || res.data;

      // Đảm bảo gắn thông tin user để hiển thị ngay
      if (newComment && currentUser) {
        newComment.user = {
          id: currentUser.id,
          full_name: currentUser.full_name,
          username: currentUser.username,
          avatar: currentUser.avatar || currentUser.profile_picture || '/default.jpg',
        };
      }

      // Reset input form
      setInput('');
      handleRemoveImage();
      setReplyingTo(null);

      onCommentAdded?.(newComment);
      toast.success(replyingTo ? 'Đã trả lời bình luận! 💬' : 'Đã gửi bình luận! 🎉');
    } catch (err) {
      console.error('Create comment error:', err);
      toast.error(err.response?.data?.message || 'Không thể gửi bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const QUICK_EMOJIS = ['❤️', '🔥', '👏', '😍', '😂', '😮', '🙌', '🎉'];

  const handleQuickEmoji = (emoji) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3 transition-colors">
      {/* QUICK EMOJI BAR (Instagram / Facebook Style) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
          Bình luận nhanh:
        </span>
        <div className="flex items-center gap-1.5">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleQuickEmoji(emoji)}
              className="text-base hover:scale-125 transition-transform p-1 rounded-full hover:bg-white dark:hover:bg-slate-800 cursor-pointer active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* FORM NHẬP BÌNH LUẬN */}
      <div className="flex flex-col space-y-2">
        {/* Reply Target Badge */}
        {replyingTo && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 animate-fadeIn">
            <span className="flex items-center gap-1.5 font-medium">
              <CornerDownRight size={13} className="text-indigo-500" />
              <span>
                Đang trả lời <strong className="font-semibold">{replyingTo.name}</strong>
              </span>
            </span>
            <button
              type="button"
              onClick={handleCancelReply}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
              title="Hủy trả lời"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Image Attachment Preview */}
        {imagePreview && (
          <div className="relative inline-block self-start rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm animate-fadeIn">
            <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              title="Xóa ảnh"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <img
            src={pickAvatar(currentUser)}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = '/default.jpg';
            }}
          />

          <div className="flex-1 relative flex items-center">
            <input
              ref={inputRef}
              id={`comment-input-${postId}`}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={replyingTo ? `Trả lời ${replyingTo.name}...` : 'Viết bình luận...'}
              className="w-full pl-3 pr-16 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />

            {/* Actions inside input: Image Picker & Send */}
            <div className="absolute right-1.5 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                title="Đính kèm ảnh"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                onClick={handleSubmit}
                disabled={(!input.trim() && !imageFile) || submitting}
                className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-full disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                title="Gửi"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
        </div>
      </div>

      {/* THANH CHỌN 2 CHẾ ĐỘ BÌNH LUẬN CHUẨN FACEBOOK */}
      {!hideQuickSortBar && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSortMenu((prev) => !prev)}
              className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <span>{sortMode === 'relevant' ? 'Phù hợp nhất' : 'Tất cả bình luận (Mới nhất)'}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} />
            </button>

            {showSortMenu && (
              <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-1.5 z-20 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => {
                    onSortChange?.('newest');
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                    sortMode === 'newest'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-semibold">Tất cả bình luận (Mới nhất)</p>
                    <p className="text-[10px] text-slate-400 font-normal">Bình luận mới nhất hiển thị trên đầu</p>
                  </div>
                  {sortMode === 'newest' && <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1">✓</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSortChange?.('relevant');
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer mt-0.5 ${
                    sortMode === 'relevant'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-semibold">Phù hợp nhất</p>
                    <p className="text-[10px] text-slate-400 font-normal">Nhiều tương tác và câu trả lời</p>
                  </div>
                  {sortMode === 'relevant' && <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1">✓</span>}
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* DANH SÁCH BÌNH LUẬN */}
      <div className="space-y-3 pt-1">
        {loadingComments ? (
          <div className="py-4 text-center text-xs text-slate-400">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
            Đang tải bình luận...
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">
            Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              isPostOwner={isPostOwner}
              onDeleted={onCommentDeleted}
              onReply={handleStartReply}
              postId={postId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PostCommentSection;
