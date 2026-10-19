import React, { useState } from 'react';
import { Send, MoreHorizontal, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { commentApi } from '../../api/commentApi';

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
}) {
  const commentUser = comment?.user || {};
  const isOwner = currentUser?.id && (currentUser.id === comment.user_id || currentUser.id === commentUser?.id);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content || '');
  const [editValue, setEditValue] = useState(comment.content || '');
  const [savingEdit, setSavingEdit] = useState(false);

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

  return (
    <div className="flex items-start gap-2.5">
      <img
        src={pickAvatar(commentUser)}
        alt=""
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
        onError={(e) => {
          e.currentTarget.src = '/default.jpg';
        }}
      />

      <div className="flex-1 min-w-0">
        <div className="bg-gray-100 rounded-2xl px-3 py-2 relative inline-block max-w-full">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-xs text-gray-900 leading-tight">
                {pickName(commentUser)}
              </p>

              {isEditing ? (
                <div className="mt-1 space-y-1.5">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={2}
                    className="w-full p-2 text-xs border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={savingEdit}
                      className="px-2.5 py-1 text-xs bg-indigo-600 text-white rounded-md disabled:opacity-50"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1 text-xs bg-gray-200 rounded-md"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-800 break-words mt-0.5">
                  {content}
                </p>
              )}
            </div>

            {/* Menu options */}
            {(isOwner || isPostOwner) && !isEditing && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 text-xs">
                    {isOwner && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 text-left"
                      >
                        <Edit className="w-3 h-3 text-blue-600" />
                        Sửa
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 text-red-600 text-left"
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

        <div className="text-[11px] text-gray-400 mt-1 ml-2">
          {safeFromNow(comment.created_at || comment.createdAt)}
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
}) => {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || submitting) return;

    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để bình luận');
      return;
    }

    setSubmitting(true);
    try {
      const res = await commentApi.create(postId, { content: text });
      const newComment = res.data?.data || res.data?.comment || res.data;
      setInput('');
      onCommentAdded?.(newComment);
      toast.success('Đã gửi bình luận');
    } catch (err) {
      console.error('Create comment error:', err);
      toast.error('Không thể gửi bình luận');
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

  return (
    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 space-y-3">
      {/* FORM NHẬP BÌNH LUẬN */}
      <div className="flex items-center gap-2.5">
        <img
          src={pickAvatar(currentUser)}
          alt=""
          className="w-8 h-8 rounded-full object-cover border border-gray-100"
          onError={(e) => {
            e.currentTarget.src = '/default.jpg';
          }}
        />
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Viết bình luận..."
            className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || submitting}
            className="absolute right-1.5 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DANH SÁCH BÌNH LUẬN */}
      <div className="space-y-3 pt-1">
        {loadingComments ? (
          <div className="py-4 text-center text-xs text-gray-400">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
            Đang tải bình luận...
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">
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
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PostCommentSection;
