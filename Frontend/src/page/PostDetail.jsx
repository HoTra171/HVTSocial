import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Send,
  Bookmark,
  Edit,
  Trash2,
  EyeOff,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import ShareModal from "../components/ShareModal";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const API_URL = "http://localhost:5000/api";
const api = axios.create({ baseURL: API_URL });

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

const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, "");

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

function ReplyItem({ reply, currentUser, onDeleted, onUpdated }) {
  const replyUser = pickUser(reply);
  const isOwner =
    currentUser?.id &&
    (currentUser.id === reply.user_id || currentUser.id === replyUser?.id);

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
                        setEditContent(post?.content || "");
                        setEditImages(images);
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
  onChangedCount,
}) {
  const commentUser = pickUser(comment);
  const isOwner =
    currentUser?.id &&
    (currentUser.id === comment.user_id || currentUser.id === commentUser?.id);

  const canHide =
    isPostOwner &&
    currentUser?.id &&
    currentUser.id !== (comment.user_id || commentUser?.id);

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
      const res = await api.get(`/comments/${comment.id}/replies`);
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
    const msg =
      mode === "hide" ? "Ẩn bình luận này?" : "Bạn có chắc muốn xóa bình luận này?";
    if (!window.confirm(msg)) return;

    try {
      await api.delete(`/comments/${comment.id}`, { headers: getAuthHeaders() });
      toast.success(mode === "hide" ? "Đã ẩn bình luận" : "Đã xóa bình luận");
      setShowMenu(false);
      onDeleted?.(comment.id);
      onChangedCount?.(-1);
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
    <div className="space-y-2 px-3 sm:px-4 py-2">
      <div className="flex items-start gap-3">
        <img
          src={pickAvatar(commentUser, pickName(commentUser))}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
          alt=""
        />

        <div className="flex-1 min-w-0">
          <div className="inline-block bg-gray-100 rounded-2xl px-3 py-2 max-w-full relative w-full">
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

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editImages, setEditImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  const isPostOwner = currentUser?.id && post?.user?.id && currentUser.id === post.user.id;

  const images = useMemo(() => {
    const raw = post?.image_urls;
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string") return raw.split(";").map((s) => s.trim()).filter(Boolean);
    return [];
  }, [post?.image_urls]);

  // Load post + comments
  useEffect(() => {
    fetchPost();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Sync editContent + images
  useEffect(() => {
    if (!post) return;
    setEditContent(post.content || "");
    setEditImages(images);
  }, [post, images]);

  // Check liked/saved
  useEffect(() => {
    const check = async () => {
      if (!post?.id || !currentUser?.id || !token) return;
      try {
        const likeRes = await api.get(`/likes/check/${post.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLiked(!!likeRes.data?.liked);

        const saveRes = await api.get(`/saved-posts/check/${post.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSaved(!!saveRes.data?.saved);
      } catch (err) {
        console.error("Check status error:", err);
      }
    };
    check();
  }, [post?.id, currentUser?.id, token]);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/posts/${postId}`, { headers: getAuthHeaders() });
      setPost(res.data);
    } catch (err) {
      console.error("Fetch post error:", err);
      toast.error("Không tìm thấy bài viết");
      navigate("/feed");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/comments/post/${postId}`, { headers: getAuthHeaders() });
      setComments(res.data || []);
    } catch (err) {
      console.error("Fetch comments error:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const statusLabel = (s) => {
    if (s === "friends") return "Bạn bè";
    if (s === "private") return "Chỉ mình tôi";
    if (s === "public") return "Công khai";
    return "Công khai";
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để thích bài viết");
      return;
    }

    try {
      const res = await api.post(
        `/likes/post/${postId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLiked(res.data?.action === "liked");
      fetchPost();
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
      const res = await api.post(
        `/saved-posts/${postId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.action === "saved") {
        setSaved(true);
        toast.success("Đã lưu bài viết");
      } else {
        setSaved(false);
        toast.success("Đã bỏ lưu bài viết");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Không thể lưu bài viết");
    }
  };

  const handleComment = async () => {
    const text = commentText.trim();
    if (!text) return;

    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }

    try {
      await api.post(
        `/comments`,
        { post_id: postId, content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCommentText("");
      await fetchComments();
      await fetchPost();
      toast.success("Đã bình luận");
    } catch (err) {
      console.error("Comment error:", err);
      toast.error("Bình luận thất bại");
    }
  };
  const fileInputId = `post-detail-edit-images-${postId}`;

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
      // Preserve current post visibility status when updating
      await api.put(
        `/posts/${postId}`,
        { content: text, media: nextImages.join(";") || null, status: post?.status, user_id: currentUser?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPost((prev) => ({
        ...prev,
        content: text,
        image_urls: nextImages,
        media: nextImages.join(";") || null,
      }));

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
      await api.delete(`/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { user_id: currentUser?.id },
      });

      toast.success("Đã xóa bài viết");
      navigate("/feed");
    } catch (err) {
      console.error("Delete post error:", err);
      toast.error("Không thể xóa bài viết");
    }
  };

  const handleShareSuccess = () => fetchPost();

  const topLevelComments = useMemo(
    () => comments.filter((c) => !c.comment_parent),
    [comments]
  );

  const onMainCommentKeyDown = (e) => {
    const isComposing = e.nativeEvent?.isComposing;
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleComment();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-[#f0f2f5] sm:-ml-46">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-base sm:text-lg">Bài viết</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-2 sm:p-4 pt-3">
        {/* Post Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          {/* Post Header */}
          <div className="p-3 sm:p-4 flex items-start justify-between">
            <div
              onClick={() => navigate(`/profile/${post.user.id}`)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <img
                src={pickAvatar(post.user, pickName(post.user))}
                alt={pickName(post.user)}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm sm:text-base leading-tight">
                  {pickName(post.user)}
                </span>
                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                  <span>{safeFromNow(post.createdAt || post.created_at)}</span>
                  <span className="mx-1">·</span>
                  {/* <span>Bạn bè</span> */}
                  <span>{statusLabel(post.status)}</span>
                </div>
              </div>
            </div>

            {isPostOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10 overflow-hidden">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
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

          {/* Content */}
          <div className="px-3 sm:px-4 pb-3">
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                />

                <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Quyền xem</span>
                    <select
                      value={post.status}
                      onChange={(e) =>
                        setPost((prev) => ({ ...prev, status: e.target.value }))
                      }
                      className="ml-2 px-2 py-1 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="public">Công khai</option>
                      <option value="friends">Bạn bè</option>
                      <option value="private">Chỉ mình tôi</option>
                    </select>
                  </div>

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

                  <div className="flex gap-2">
                    <input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Dán link ảnh (tuỳ chọn)"
                      className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={addImageByUrl}
                      className="px-3 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Thêm
                    </button>
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
                      setEditContent(post.content || "");
                      setEditImages(images);
                      setNewImageUrl("");
                    }}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              post.content && (
                <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
              )
            )}
          </div>

          {/* Images */}
          {!isEditing && images.length > 0 && (
            <div
              className={`w-full bg-black/5 ${images.length === 1 ? "" : "grid grid-cols-2 gap-0.5"
                }`}
            >
              {images.map((url, index) => (
                <div key={`image-${index}`} className="relative">
                  <img
                    src={url}
                    alt=""
                    className="w-full max-h-[550px] object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="px-3 sm:px-4 py-2 flex items-center justify-between text-xs sm:text-sm text-gray-600 border-t">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px]">
                <Heart className="w-3 h-3" />
              </div>
              <span>{post.likes_count} lượt thích</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="hover:underline">
                {post.comments_count} bình luận
              </button>
              <button className="hover:underline">
                {post.share_count} lượt chia sẻ
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="px-1 sm:px-2 py-1 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex flex-1 items-center justify-around">
                <button
                  onClick={handleLike}
                  className="flex items-center gap-2 py-2 rounded-md hover:bg-gray-100 transition text-sm font-medium text-gray-700"
                >
                  <Heart className={`w-4 h-4 ${liked ? "text-red-500 fill-red-500" : ""}`} />
                  <span>Thích</span>
                </button>

                <button
                  onClick={() => {
                    // scroll tới comment input
                    document.getElementById("comment-input")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="flex items-center gap-2 py-2 rounded-md hover:bg-gray-100 transition text-sm font-medium text-gray-700"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Bình luận</span>
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 py-2 rounded-md hover:bg-gray-100 transition text-sm font-medium text-gray-700"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ</span>
                </button>
              </div>

              <button
                onClick={handleSave}
                className="ml-2 p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Bookmark className={`w-5 h-5 ${saved ? "fill-yellow-500 text-yellow-500" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
          {/* Comment Input */}
          <div className="p-3 sm:p-4 border-b border-gray-200" id="comment-input">
            <div className="flex gap-3">
              <img
                src={pickAvatar(currentUser || {}, currentUser?.full_name || "User")}
                alt=""
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
              />
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={onMainCommentKeyDown}
                  placeholder="Viết bình luận công khai..."
                  className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm border border-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="py-1">
            <div className="px-4 pt-2 pb-1 text-sm font-semibold text-gray-700">
              Bình luận ({topLevelComments.length})
            </div>

            {loadingComments ? (
              <p className="text-sm text-gray-400 text-center py-4">Đang tải...</p>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto">
                {topLevelComments.map((c) => (
                  <CommentThreadItem
                    key={`comment-${c.id}`}
                    comment={c}
                    postId={postId}
                    currentUser={currentUser}
                    isPostOwner={!!isPostOwner}
                    onDeleted={(commentId) => setComments((prev) => prev.filter((x) => x.id !== commentId))}
                    onChangedCount={() => fetchPost()}
                  />
                ))}

                {topLevelComments.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Chưa có bình luận nào</p>
                    <p className="text-xs sm:text-sm">Hãy là người đầu tiên bình luận</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal với onSuccess → fetchPost() */}
      {showShareModal && (
        <ShareModal
          post={post}
          onClose={() => setShowShareModal(false)}
          onSuccess={handleShareSuccess}
        />
      )}
    </div>
  );
};

export default PostDetail;
