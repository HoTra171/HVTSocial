import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit,
  Trash2,
  EyeOff,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL, SERVER_ORIGIN } from '../constants/api';

dayjs.extend(relativeTime);
dayjs.locale("vi");


const api = axios.create({ baseURL: `${API_URL}` });
const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildAvatarFallback = () => "/default.jpg";

const getAuthor = (obj) => obj?.user || {};
const getFullName = (obj) =>
  getAuthor(obj)?.full_name || obj?.full_name || "User";
const getAvatar = (obj) =>
  getAuthor(obj)?.profile_picture ||
  getAuthor(obj)?.avatar ||
  obj?.profile_picture ||
  obj?.avatar ||
  buildAvatarFallback(getFullName(obj));



const CommentItem = ({
  comment,
  currentUser,
  postId,
  onCommentDeleted,
  canModerate = false, // chủ bài viết
  onCommentChanged, // optional: để parent refresh count
}) => {
  const isOwner = currentUser?.id === comment.user_id;
  const canDelete = isOwner || canModerate;

  // Hiển thị content (KHÔNG mutate props)
  const [content, setContent] = useState(comment.content || "");
  useEffect(() => setContent(comment.content || ""), [comment.content]);

  // Menu / edit
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content || "");
  useEffect(() => setEditValue(comment.content || ""), [comment.content]);

  // Reply form + replies
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const [replies, setReplies] = useState([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // close menu when click outside
  useEffect(() => {
    if (!menuOpen) return;

    const onDown = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const repliesCount = useMemo(() => {
    // ưu tiên count từ backend nếu có
    if (Number.isFinite(comment.replies_count)) return comment.replies_count;
    if (!repliesLoaded) return 0;
    return replies.length;
  }, [comment.replies_count, repliesLoaded, replies.length]);

  const loadReplies = async () => {
    // đã load rồi thì chỉ toggle
    if (repliesLoaded) {
      setShowReplies((v) => !v);
      return;
    }

    setLoadingReplies(true);
    try {
      const res = await api.get(`/comments/${comment.id}/replies`);
      setReplies(res.data || []);
      setRepliesLoaded(true);
      setShowReplies(true);
    } catch (e) {
      console.error("Load replies error:", e);
      toast.error("Không thể tải phản hồi");
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleAddReply = async () => {
    if (!replyInput.trim()) return;

    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để trả lời");
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await api.post(
        `/comments`,
        {
          post_id: postId,
          content: replyInput,
          comment_parent: comment.id,
        },
        { headers: authHeaders() }
      );

      const newReply = res.data?.comment;
      if (newReply) {
        setReplies((prev) => [...prev, newReply]);
        setRepliesLoaded(true);
        setShowReplies(true);
      }

      setReplyInput("");
      setShowReplyForm(false);
      toast.success("Đã trả lời");
      onCommentChanged?.();
    } catch (e) {
      console.error("Add reply error:", e);
      toast.error("Không thể thêm phản hồi");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEditComment = async () => {
    if (!editValue.trim()) return;

    try {
      await api.put(
        `/comments/${comment.id}`,
        { content: editValue },
        { headers: authHeaders() }
      );
      setContent(editValue);
      setIsEditing(false);
      setMenuOpen(false);
      toast.success("Đã cập nhật bình luận");
    } catch (e) {
      console.error("Edit comment error:", e);
      toast.error("Không thể cập nhật bình luận");
    }
  };

  const handleDeleteComment = async () => {
    const confirmText = isOwner
      ? "Bạn có chắc muốn xóa bình luận này?"
      : "Ẩn/Xóa bình luận này?";

    if (!window.confirm(confirmText)) return;

    try {
      await api.delete(`/comments/${comment.id}`, { headers: authHeaders() });
      toast.success(isOwner ? "Đã xóa bình luận" : "Đã ẩn bình luận");
      setMenuOpen(false);
      onCommentDeleted?.(comment.id);
      onCommentChanged?.();
    } catch (e) {
      console.error("Delete/Hide comment error:", e);
      toast.error(isOwner ? "Không thể xóa bình luận" : "Không thể ẩn bình luận");
    }
  };

  return (
    <div className="space-y-2">
      {/* MAIN COMMENT */}
      <div className="flex items-start gap-3">
        <img
          src={getAvatar(comment)}
          className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
          alt=""
        />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEditComment}
                  className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Lưu
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(content);
                  }}
                  className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 p-3 rounded-lg relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {getFullName(comment)}
                  </p>
                  <p className="text-sm text-gray-700 break-words">{content}</p>
                </div>

                {canDelete && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      className="p-1 hover:bg-gray-200 rounded-full"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow-lg z-20">
                        {isOwner && (
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
                          >
                            <Edit className="w-3 h-3" />
                            Chỉnh sửa
                          </button>
                        )}

                        {/* nếu là chủ bài viết mà không phải chủ comment → hiện “Ẩn” */}
                        {!isOwner && canModerate ? (
                          <button
                            onClick={handleDeleteComment}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm text-gray-700"
                          >
                            <EyeOff className="w-3 h-3" />
                            Ẩn
                          </button>
                        ) : (
                          <button
                            onClick={handleDeleteComment}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                            Xóa
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTION BAR */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span>{dayjs(comment.created_at).fromNow()}</span>

              <button
                onClick={() => setShowReplyForm((v) => !v)}
                className="hover:text-indigo-600 font-medium"
              >
                Trả lời
              </button>

              {repliesCount > 0 && (
                <button
                  onClick={loadReplies}
                  className="flex items-center gap-1 hover:text-indigo-600 font-medium"
                >
                  {showReplies ? (
                    <>
                      Ẩn phản hồi <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Xem {repliesCount} phản hồi <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* REPLY FORM */}
          {showReplyForm && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={
                  currentUser?.profile_picture ||
                  currentUser?.avatar ||
                  buildAvatarFallback(currentUser?.full_name)
                }
                className="w-7 h-7 rounded-full object-cover"
                alt=""
              />
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddReply()}
                placeholder="Viết phản hồi..."
                className="flex-1 px-3 py-2 text-sm border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddReply}
                disabled={submittingReply || !replyInput.trim()}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* REPLIES LIST */}
          {showReplies && (
            <div className="mt-2 pl-2 border-l border-gray-200 space-y-2">
              {loadingReplies ? (
                <p className="text-xs text-gray-400">Đang tải phản hồi...</p>
              ) : replies.length === 0 ? (
                <p className="text-xs text-gray-400">Chưa có phản hồi</p>
              ) : (
                replies.map((r) => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    currentUser={currentUser}
                    postId={postId}
                    canModerate={canModerate}
                    onCommentDeleted={(deletedId) => {
                      setReplies((prev) => prev.filter((x) => x.id !== deletedId));
                      onCommentChanged?.();
                    }}
                    onCommentChanged={() => {
                      onCommentChanged?.();
                    }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
