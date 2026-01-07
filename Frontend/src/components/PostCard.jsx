import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  BadgeCheck,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  EyeOff,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import ShareModal from "./ShareModal";
import { API_URL, SERVER_ORIGIN } from '../constants/api';

dayjs.extend(relativeTime);
dayjs.locale("vi");


const api = axios.create({ baseURL: `${API_URL}` });
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const safeFromNow = (d) => {
  if (!d) return "";
  try {
    return dayjs(d).fromNow();
  } catch {
    return "";
  }
};

const pickUser = (obj) => obj?.user || obj || {};
const pickName = (u, fallback = "User") =>
  u?.full_name || u?.name || u?.username || fallback;
const pickAvatar = (u, fallbackName = "User") =>
  u?.profile_picture ||
  u?.avatar ||
  u?.photo ||
  `/default.jpg`;

const parseImages = (raw) => {
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw === "string") return raw.split(";").map((s) => s.trim()).filter(Boolean);
  return [];
};

const toAbsoluteUrl = (u) => {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `http:${s}`;
  if (s.startsWith("/")) return `${SERVER_ORIGIN}${s}`;
  return `${SERVER_ORIGIN}/${s}`;
};

const extractUploadUrls = (data) => {
  if (!data) return [];
  if (typeof data === "string") return [data];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.urls)) return data.urls;
  if (typeof data.url === "string") return [data.url];
  if (typeof data.path === "string") return [data.path];
  if (data.file) {
    if (typeof data.file === "string") return [data.file];
    if (typeof data.file.url === "string") return [data.file.url];
    if (typeof data.file.path === "string") return [data.file.path];
  }
  if (Array.isArray(data.files)) {
    return data.files
      .map((f) => f?.url || f?.path || f?.location)
      .filter(Boolean);
  }
  return [];
};

function ReplyItem({ reply, currentUser, onDeleted, onUpdated }) {
  const replyUser = pickUser(reply);
  const isOwner = currentUser?.id && (currentUser.id === reply.user_id || currentUser.id === replyUser?.id);

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(reply.content || "");
  const [editValue, setEditValue] = useState(reply.content || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(reply.content || "");
    setEditValue(reply.content || "");
  }, [reply.content]);

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa phản hồi này?")) return;
    try {
      await api.delete(`/comments/${reply.id}`, { headers: getAuthHeaders() });
      toast.success("Đã xóa phản hồi");
      onDeleted?.(reply.id);
    } catch (err) {
      console.error("Delete reply error:", err);
      toast.error("Không thể xóa phản hồi");
    }
  };

  const handleSave = async () => {
    const text = editValue.trim();
    if (!text || saving) return;

    setSaving(true);
    try {
      await api.put(
        `/comments/${reply.id}`,
        { content: text },
        { headers: getAuthHeaders() }
      );
      setContent(text);
      setIsEditing(false);
      setShowMenu(false);
      toast.success("Đã cập nhật phản hồi");
      onUpdated?.(reply.id, text);
    } catch (err) {
      console.error("Edit reply error:", err);
      toast.error("Không thể cập nhật phản hồi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start gap-2">
      <img
        src={pickAvatar(replyUser, pickName(replyUser))}
        className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
        alt=""
      />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 p-2 rounded-lg relative">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs truncate">
                {pickName(replyUser)}
              </p>

              {isEditing ? (
                <div className="mt-1 space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditValue(content);
                      }}
                      className="px-3 py-1 text-xs bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-700 break-words">{content}</p>
              )}
            </div>

            {isOwner && !isEditing && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-600" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-10 overflow-hidden">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-xs"
                    >
                      <Edit className="w-3 h-3" />
                      Sửa
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-red-600 text-left text-xs"
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

        <span className="text-[11px] text-gray-400 mt-0.5 block">
          {safeFromNow(reply.created_at || reply.createdAt)}
        </span>
      </div>
    </div>
  );
}

function CommentThreadItem({
  comment,
  postId,
  currentUser,
  isPostOwner,
  onDeleted,
}) {
  const commentUser = pickUser(comment);
  const isOwner =
    currentUser?.id &&
    (currentUser.id === comment.user_id || currentUser.id === commentUser?.id);

  const canHide =
    isPostOwner && currentUser?.id && currentUser.id !== (comment.user_id || commentUser?.id);

  const [showMenu, setShowMenu] = useState(false);

  const [content, setContent] = useState(comment.content || "");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content || "");
  const [savingEdit, setSavingEdit] = useState(false);

  // Reply
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Replies list
  const [replies, setReplies] = useState([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  useEffect(() => {
    setContent(comment.content || "");
    setEditValue(comment.content || "");
  }, [comment.content]);

  const repliesCount = useMemo(() => {
    const c = Number(comment.replies_count);
    return Number.isFinite(c) && c >= 0 ? c : replies.length;
  }, [comment.replies_count, replies.length]);

  const loadReplies = async () => {
    if (repliesLoaded) {
      setShowReplies((v) => !v);
      return;
    }

    setLoadingReplies(true);
    try {
      const res = await api.get(`/comments/${comment.id}/replies`, { headers: getAuthHeaders() });
      setReplies(res.data || []);
      setRepliesLoaded(true);
      setShowReplies(true);
    } catch (err) {
      console.error("Load replies error:", err);
      toast.error("Không thể tải phản hồi");
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleAddReply = async () => {
    const text = replyInput.trim();
    if (!text || submittingReply) return;

    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để trả lời");
      return;
    }

    setSubmittingReply(true);
    try {
      const res = await api.post(
        `/comments`,
        { post_id: postId, content: text, comment_parent: comment.id },
        { headers: getAuthHeaders() }
      );

      const newReply = res.data?.comment || res.data;
      setReplies((prev) => [newReply, ...prev]);
      setRepliesLoaded(true);
      setShowReplies(true);

      setReplyInput("");
      setShowReplyForm(false);
      toast.success("Đã trả lời");
    } catch (err) {
      console.error("Add reply error:", err);
      toast.error("Không thể thêm phản hồi");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (mode = "delete") => {
    const msg = mode === "hide" ? "Ẩn bình luận này?" : "Bạn có chắc muốn xóa bình luận này?";
    if (!window.confirm(msg)) return;

    try {
      await api.delete(`/comments/${comment.id}`, { headers: getAuthHeaders() });
      toast.success(mode === "hide" ? "Đã ẩn bình luận" : "Đã xóa bình luận");
      setShowMenu(false);
      onDeleted?.(comment.id);
    } catch (err) {
      console.error("Delete/hide comment error:", err);
      toast.error(mode === "hide" ? "Không thể ẩn bình luận" : "Không thể xóa bình luận");
    }
  };

  const handleSaveEdit = async () => {
    const text = editValue.trim();
    if (!text || savingEdit) return;

    setSavingEdit(true);
    try {
      await api.put(
        `/comments/${comment.id}`,
        { content: text },
        { headers: getAuthHeaders() }
      );

      setContent(text);
      setIsEditing(false);
      setShowMenu(false);
      toast.success("Đã cập nhật bình luận");
    } catch (err) {
      console.error("Edit comment error:", err);
      toast.error("Không thể cập nhật bình luận");
    } finally {
      setSavingEdit(false);
    }
  };

  const onReplyKeyDown = (e) => {
    const isComposing = e.nativeEvent?.isComposing;
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleAddReply();
    }
  };

  return (
    <div className="space-y-2">
      {/* MAIN COMMENT */}
      <div className="flex items-start gap-3">
        <img
          src={pickAvatar(commentUser, pickName(commentUser))}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          alt=""
        />

        <div className="flex-1 min-w-0">
          <div className="bg-gray-100 rounded-2xl px-3 py-2 relative">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs sm:text-sm leading-tight truncate">
                  {pickName(commentUser)}
                </p>

                {isEditing ? (
                  <div className="mt-1 space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={3}
                      className="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditValue(content);
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900 break-words">{content}</p>
                )}
              </div>

              {(isOwner || canHide) && !isEditing && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu((v) => !v)}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border z-10 overflow-hidden">
                      {isOwner && (
                        <>
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Chỉnh sửa
                          </button>

                          <button
                            onClick={() => handleDeleteComment("delete")}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-red-600 text-left text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </button>
                        </>
                      )}

                      {!isOwner && canHide && (
                        <button
                          onClick={() => handleDeleteComment("hide")}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
                        >
                          <EyeOff className="w-4 h-4" />
                          Ẩn
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ACTION BAR */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-1 ml-1 text-[11px] sm:text-xs text-gray-500">
              <span>{safeFromNow(comment.created_at || comment.createdAt)}</span>

              <button
                onClick={() => setShowReplyForm((v) => !v)}
                className="font-semibold hover:underline"
              >
                Trả lời
              </button>

              {repliesCount > 0 && (
                <button
                  onClick={loadReplies}
                  className="flex items-center gap-1 font-semibold hover:underline"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Ẩn phản hồi ({repliesCount})
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Xem phản hồi ({repliesCount})
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
                src={pickAvatar(currentUser || {}, currentUser?.full_name || "User")}
                className="w-7 h-7 rounded-full object-cover"
                alt=""
              />
              <input
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                onKeyDown={onReplyKeyDown}
                placeholder="Viết phản hồi..."
                className="flex-1 px-3 py-2 text-sm border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddReply}
                disabled={!replyInput.trim() || submittingReply}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* REPLIES LIST */}
          {showReplies && (
            <div className="mt-2 pl-2 sm:pl-6 space-y-2">
              {loadingReplies ? (
                <p className="text-xs text-gray-400">Đang tải phản hồi...</p>
              ) : replies.length === 0 ? (
                <p className="text-xs text-gray-400">Chưa có phản hồi nào</p>
              ) : (
                replies.map((r) => (
                  <ReplyItem
                    key={`reply-${r.id}`}
                    reply={r}
                    currentUser={currentUser}
                    onDeleted={(replyId) =>
                      setReplies((prev) => prev.filter((x) => x.id !== replyId))
                    }
                    onUpdated={(replyId, newText) =>
                      setReplies((prev) =>
                        prev.map((x) =>
                          x.id === replyId ? { ...x, content: newText } : x
                        )
                      )
                    }
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const PostCard = ({ post, currentUser, onPostDeleted, onPostUnsaved, onPostUnliked }) => {
  const navigate = useNavigate();

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post.likes_count) || 0);

  const [saved, setSaved] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(Number(post.comments_count) || 0);

  const [commentInput, setCommentInput] = useState("");

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(post.content || "");
  const [editContent, setEditContent] = useState(post.content || "");

  const [editStatus, setEditStatus] = useState(
    ["public", "friends", "private"].includes(String(post?.status || "public").toLowerCase())
      ? String(post?.status || "public").toLowerCase()
      : "public"
  );

  const [showShareModal, setShowShareModal] = useState(false);

  const postUser = post?.user || {};
  const isPostOwner = currentUser?.id && currentUser.id === postUser?.id;
  const [currentImages, setCurrentImages] = useState(() => parseImages(post?.image_urls));
  const [editImages, setEditImages] = useState(() => parseImages(post?.image_urls));
  const [uploadingImages, setUploadingImages] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");
  const images = currentImages;

  useEffect(() => {
    setLikesCount(Number(post.likes_count) || 0);
    setCommentsCount(Number(post.comments_count) || 0);
    setContent(post.content || "");
    setEditContent(post.content || "");
    const imgs = parseImages(post?.image_urls);
    setCurrentImages(imgs);
    setEditImages(imgs);
    setComments([]);
    setShowComments(false);
    setCommentInput("");
    setEditStatus(
      ["public", "friends", "private"].includes(String(post?.status || "public").toLowerCase())
        ? String(post?.status || "public").toLowerCase()
        : "public"
    );
  }, [post.id]);

  const postWithHashTags = useMemo(() => {
    return (content || "").replace(
      /#(\w+)/g,
      '<span class="text-indigo-600 font-semibold">#$1</span>'
    );
  }, [content]);

  useEffect(() => {
    const checkLikeAndSaveStatus = async () => {
      if (!currentUser?.id) return;
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const likeRes = await api.get(`/likes/check/${post.id}`, {
          headers: getAuthHeaders(),
        });
        setLiked(!!likeRes.data?.liked);

        const saveRes = await api.get(`/saved-posts/check/${post.id}`, {
          headers: getAuthHeaders(),
        });
        setSaved(!!saveRes.data?.saved);
      } catch (err) {
        console.error("Check status error:", err);
      }
    };

    checkLikeAndSaveStatus();
  }, [post.id, currentUser?.id]);

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để thích bài viết");
      return;
    }

    try {
      const res = await api.post(`/likes/post/${post.id}`, {}, { headers: getAuthHeaders() });

      if (res.data?.action === "liked") {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      } else {
        setLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
        onPostUnliked?.(post.id);
      }
    } catch (err) {
      console.error("Like error:", err);
      toast.error("Không thể thích bài viết");
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để lưu bài viết");
      return;
    }

    try {
      const res = await api.post(`/saved-posts/${post.id}`, {}, { headers: getAuthHeaders() });
      if (res.data?.action === "saved") {
        setSaved(true);
        toast.success("Đã lưu bài viết");
      } else {
        setSaved(false);
        toast.success("Đã bỏ lưu bài viết");
        onPostUnsaved?.(post.id);
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Không thể lưu bài viết");
    }
  };

  const loadComments = useCallback(async () => {
    // Toggle nếu đã load rồi
    if (comments.length > 0) {
      setShowComments((v) => !v);
      return;
    }

    setLoadingComments(true);
    try {
      const res = await api.get(`/comments/post/${post.id}`, { headers: getAuthHeaders() });
      const list = res.data || [];
      setComments(list);

      // Nếu DB không trả comments_count chính xác, fallback:
      const topLevelCount = list.filter((c) => !c.comment_parent).length;
      if (!Number.isFinite(Number(post.comments_count)) || Number(post.comments_count) === 0) {
        setCommentsCount(topLevelCount);
      }

      setShowComments(true);
    } catch (err) {
      console.error("Load comments error:", err);
      toast.error("Không thể tải bình luận");
    } finally {
      setLoadingComments(false);
    }
  }, [comments.length, post.id, post.comments_count]);

  const onMainCommentKeyDown = (e) => {
    const isComposing = e.nativeEvent?.isComposing;
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleAddComment = async () => {
    const text = commentInput.trim();
    if (!text) return;

    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }

    try {
      const res = await api.post(
        `/comments`,
        { post_id: post.id, content: text },
        { headers: getAuthHeaders() }
      );

      const newComment = res.data?.comment || res.data;
      setComments((prev) => [newComment, ...prev]);
      setCommentsCount((prev) => prev + 1);

      setCommentInput("");
      toast.success("Đã thêm bình luận");
      setShowComments(true);
    } catch (err) {
      console.error("Add comment error:", err);
      toast.error("Không thể thêm bình luận");
    }
  };
  const fileInputId = `post-edit-images-${post.id}`;

  const moveEditImage = (from, to) => {
    setEditImages((prev) => {
      if (!Array.isArray(prev)) return prev;
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const removeEditImage = (idx) => {
    setEditImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const addImageByUrl = () => {
    const raw = newImageUrl.trim();
    if (!raw) return;
    const abs = toAbsoluteUrl(raw);
    setEditImages((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      if (!next.includes(abs)) next.push(abs);
      return next;
    });
    setNewImageUrl("");
  };

  const shouldRetryUpload = (err) => {
    const status = err?.response?.status;
    const msg = String(err?.response?.data?.message || err?.message || "");
    return status === 400 || /unexpected field|limit_unexpected_file/i.test(msg);
  };

  const uploadImages = async (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return [];

    // NHIỀU FILE -> /upload/multiple + field "files"
    if (arr.length > 1) {
      const form = new FormData();
      arr.forEach((f) => form.append("files", f));    
      const res = await api.post("/upload/multiple", form, {
        headers: { ...getAuthHeaders() },
      });

      const urls = (res.data?.urls || []).map(toAbsoluteUrl).filter(Boolean);
      if (!urls.length) throw new Error("Upload không trả về URL ảnh");
      return urls;
    }

    // 1 FILE -> /upload + field "file"
    const form = new FormData();
    form.append("file", arr[0]);                        
    const res = await api.post("/upload", form, {
      headers: { ...getAuthHeaders() },
    });

    const url = toAbsoluteUrl(res.data?.url);
    if (!url) throw new Error("Upload không trả về URL ảnh");
    return [url];
  };


  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    setUploadingImages(true);
    try {
      const urls = await uploadImages(files);
      setEditImages((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        urls.forEach((u) => {
          if (!next.includes(u)) next.push(u);
        });
        return next;
      });
      toast.success("Đã thêm ảnh");
    } catch (err) {
      console.error("Upload images error:", err);
      toast.error("Không thể upload ảnh (kiểm tra API /api/upload)");
    } finally {
      setUploadingImages(false);
    }
  };


  const handleEditPost = async () => {
    const text = String(editContent ?? "").trim();
    const nextImages = (editImages || [])
      .map((s) => String(s || "").trim())
      .filter(Boolean);

    if (!text && nextImages.length === 0) {
      toast.error("Bài viết không được để trống");
      return;
    }

    try {
      await api.put(
        `/posts/${post.id}`,
        {
          content: text,
          media: nextImages.join(";") || null,
          user_id: currentUser?.id,
          status: editStatus,
        },
        { headers: getAuthHeaders() }
      );

      setContent(text);
      setCurrentImages(nextImages);
      setIsEditing(false);
      setShowMenu(false);
      toast.success("Đã cập nhật bài viết");
    } catch (err) {
      console.error("Edit post error:", err);
      toast.error("Không thể cập nhật bài viết");
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này?")) return;

    try {
      await api.delete(`/posts/${post.id}`, {
        headers: getAuthHeaders(),
        data: { user_id: currentUser?.id },
      });

      toast.success("Đã xóa bài viết");
      onPostDeleted?.(post.id);
    } catch (err) {
      console.error("Delete post error:", err);
      toast.error("Không thể xóa bài viết");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg p-5 space-y-4 w-full max-w-2xl transition-all duration-200">
      {/* USER INFO + MENU */}
      <div className="flex items-center justify-between">
        <div
          onClick={() => postUser?.id && navigate(`/profile/${postUser.id}`)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img
            src={pickAvatar(postUser, pickName(postUser))}
            alt=""
            className="w-11 h-11 rounded-full shadow object-cover"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-900">
                {pickName(postUser)}
              </span>
              <BadgeCheck className="text-blue-500 w-4 h-4" />
            </div>
            <div className="text-gray-500 text-sm">
              @{postUser?.username || "user"} • {safeFromNow(post.createdAt || post.created_at)} • {editStatus === "friends" ? "Bạn bè" : editStatus === "private" ? "Chỉ mình tôi" : "Công khai"}
            </div>
          </div>
        </div>

        {isPostOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10 overflow-hidden">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(content);
                    setEditImages(currentImages);
                    setShowMenu(false);
                    setEditStatus(
                      ["public", "friends", "private"].includes(String(post?.status || "public").toLowerCase())
                        ? String(post?.status || "public").toLowerCase()
                        : "public"
                    );
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-left"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={handleDeletePost}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-red-600 text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTENT */}
      {isEditing ? (
        <div className="space-y-3">
          {/* STATUS - quyền xem bài viết (chỉ hiện khi sửa post) */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Quyền xem:</span>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="text-sm border rounded-md px-2 py-1"
            >
              <option value="public">Công khai</option>
              <option value="friends">Bạn bè</option>
              <option value="private">Chỉ mình tôi</option>
            </select>
          </div>

          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={4}
          />

          <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-700">Ảnh</span>

              <label
                htmlFor={fileInputId}
                className="cursor-pointer text-xs px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-100"
              >
                {uploadingImages ? "Đang tải..." : "Thêm ảnh"}
              </label>
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickImages}
                disabled={uploadingImages}
              />
            </div>

            {editImages.length === 0 ? (
              <p className="text-xs text-gray-500">Chưa có ảnh</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {editImages.map((url, idx) => (
                  <div key={`edit-img-${idx}`} className="relative group">
                    <img
                      src={url}
                      alt=""
                      className="w-full h-28 object-cover rounded-lg border"
                    />
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => moveEditImage(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1 rounded bg-white/90 hover:bg-white disabled:opacity-40"
                        title="Lên"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveEditImage(idx, idx + 1)}
                        disabled={idx === editImages.length - 1}
                        className="p-1 rounded bg-white/90 hover:bg-white disabled:opacity-40"
                        title="Xuống"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEditImage(idx)}
                        className="p-1 rounded bg-white/90 hover:bg-white"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleEditPost}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Lưu
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(content);
                setEditImages(currentImages);
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        content && (
          <div
            className="text-gray-800 text-sm whitespace-pre-line leading-relaxed"
            dangerouslySetInnerHTML={{ __html: postWithHashTags }}
            onClick={() => navigate(`/post/${post.id}`)}
          />
        )
      )}

      {/* IMAGES */}
      {!isEditing && images.length > 0 && (
        <div className="grid grid-cols-1 gap-2" onClick={() => navigate(`/post/${post.id}`)}>
          {images.map((img, index) => (
            <img
              key={`img-${index}`}
              src={img}
              alt=""
              className={`w-full rounded-lg object-cover ${images.length === 1 ? "max-h-96" : "h-48"
                }`}
            />
          ))}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-6 text-gray-600">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 hover:text-red-500 transition"
          >
            <Heart className={`w-5 h-5 ${liked ? "text-red-500 fill-red-500" : ""}`} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>

          {/* Nút comment giờ sẽ load/toggle comments */}
          <button
            onClick={loadComments}
            className="flex items-center gap-1.5 hover:text-blue-500 transition"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{commentsCount}</span>
          </button>

          <button onClick={() => setShowShareModal(true)} className="hover:text-green-600 transition">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal post={post} onClose={() => setShowShareModal(false)} />
        )}

        <button onClick={handleSave} className="hover:text-yellow-500 transition">
          <Bookmark className={`w-5 h-5 ${saved ? "fill-yellow-500 text-yellow-500" : ""}`} />
        </button>
      </div>

      {/* COMMENTS SECTION */}
      {showComments && (
        <div className="mt-4 pt-4 border-t space-y-3">
          {/* Input comment chính */}
          {currentUser && (
            <div className="flex items-center gap-2">
              <img
                src={pickAvatar(currentUser, currentUser?.full_name || "User")}
                className="w-9 h-9 rounded-full object-cover"
                alt=""
              />
              <input
                type="text"
                placeholder="Viết bình luận..."
                className="flex-1 px-4 py-2 text-sm border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={onMainCommentKeyDown}
              />
              <button
                onClick={handleAddComment}
                disabled={!commentInput.trim()}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <p className="text-sm text-gray-400 text-center">Đang tải...</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {comments
                .filter((c) => !c.comment_parent)
                .map((c) => (
                  <CommentThreadItem
                    key={c.id}
                    comment={c}
                    postId={post.id}
                    currentUser={currentUser}
                    isPostOwner={!!isPostOwner}
                    onDeleted={(commentId) => {
                      setComments((prev) => prev.filter((x) => x.id !== commentId));
                      setCommentsCount((prev) => Math.max(0, prev - 1));
                    }}
                  />
                ))}

              {comments.filter((c) => !c.comment_parent).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Chưa có bình luận nào
                </p>
              )}

              <button
                onClick={() => navigate(`/post/${post.id}`)}
                className="w-full text-center text-sm text-indigo-600 hover:underline py-2"
              >
                Xem chi tiết bài viết
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
