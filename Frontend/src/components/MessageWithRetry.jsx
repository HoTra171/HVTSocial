import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  CheckCheck,
  AlertCircle,
  RefreshCw,
  Smile,
  MoreVertical,
  Reply
} from "lucide-react";
import { getFullImageUrl, handleImageError } from "../utils/imageHelper.js";

const MessageBubble = ({
  msg,
  isMe,
  partner,
  onRetry,
  onReact,
  onEdit,
  onRecall,
  onReply,
  isReply,
  replyData,
  onImageClick,
  openMenuId,
  setOpenMenuId,
  reactMenuFor,
  setReactMenuFor,
  onReplyClick,
  id // Receive id prop
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const longPressTimer = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const menuRef = useRef(null);
  const reactMenuRef = useRef(null);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const touchStartRef = useRef({ x: 0, y: 0 });

  const isRecalled = msg.recalled;

  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    longPressTimer.current = setTimeout(() => {
      if (isMobile) setShowMobileMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchMove = (e) => {
    if (longPressTimer.current) {
      const moveX = e.touches[0].clientX;
      const moveY = e.touches[0].clientY;
      const diffX = Math.abs(moveX - touchStartRef.current.x);
      const diffY = Math.abs(moveY - touchStartRef.current.y);

      // Only cancel if moved significantly (> 10px) (scrolling)
      if (diffX > 10 || diffY > 10) {
        clearTimeout(longPressTimer.current);
      }
    }
  };

  const handleContextMenu = (e) => {
    if (isMobile) {
      e.preventDefault();
      setShowMobileMenu(true);
    }
  };

  const renderMessageStatus = () => {
    if (!isMe) return null;
    if (msg.failed) return <AlertCircle size={14} className="text-red-500" />;
    if (msg.status === 'read' || msg.read) return <CheckCheck size={14} className="text-blue-500" />;
    return <CheckCheck size={14} className="text-gray-300" />;
  };

  // Render tin nhắn hệ thống (ví dụ: tạo nhóm, thêm/xóa thành viên, đổi tên nhóm)
  if (msg.message_type === "system") {
    return (
      <div id={id} className="flex justify-center my-2.5 w-full px-4">
        <span className="px-3.5 py-1 rounded-full text-xs font-medium bg-slate-200/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs text-center max-w-[85%] break-words">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        id={id} // Apply id to root div
        className={`group relative flex w-full mb-2 px-2 ${isMe ? "justify-end" : "justify-start"}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={handleContextMenu}
      >
        {/* Avatar người gửi trong nhóm hoặc chat cá nhân */}
        {!isMe && (
          <img
            src={getFullImageUrl(msg.sender_avatar || partner?.avatar || "/default.jpg")}
            className="w-7 h-7 rounded-full object-cover flex-shrink-0 self-end mb-1 mr-2 border border-slate-200 dark:border-slate-700"
            alt=""
            onError={handleImageError}
          />
        )}

        <div className={`relative max-w-[85%] sm:max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          {/* Tên người gửi nếu là tin nhắn trong nhóm chat */}
          {!isMe && partner?.is_group_chat && (
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 ml-1">
              {msg.sender_name || msg.user_name || "Thành viên"}
            </span>
          )}

          {/* Icon bar (emoji + menu) - Visible on hover on all devices */}
          {
            !isRecalled && !msg.failed && (
              <div
                className={`flex msg-icon-bar absolute top-1/2 -translate-y-1/2 items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20
              ${isMe ? "right-full mr-2" : "left-full ml-2"}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReply && onReply(msg);
                  }}
                  className="p-1.5 bg-white dark:bg-slate-800 shadow-md rounded-full text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                  title="Trả lời tin nhắn"
                >
                  <Reply size={16} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReactMenuFor(reactMenuFor === msg.id ? null : msg.id);
                    setOpenMenuId(null);
                  }}
                  className="p-1.5 bg-white dark:bg-slate-800 shadow-md rounded-full text-slate-700 dark:text-slate-200 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                  title="Thả cảm xúc"
                >
                  <Smile size={16} />
                </button>

                {isMe && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                      setReactMenuFor(null);
                    }}
                    className="p-1.5 bg-white dark:bg-slate-800 shadow-md rounded-full text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                    title="Tùy chọn"
                  >
                    <MoreVertical size={16} />
                  </button>
                )}
              </div>
            )
          }

          {/* Menu 3 chấm */}
          {
            openMenuId === msg.id && (
              <div
                ref={menuRef}
                className={`msg-menu absolute top-0 bg-white dark:bg-slate-800 shadow-xl rounded-xl py-1 z-50 border border-slate-200 dark:border-slate-700 min-w-[150px]
              ${isMe ? "right-full mr-2" : "left-full ml-2"}`}
              >
                {msg.message_type === "text" && (
                  <button
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2 transition-colors"
                    onClick={() => {
                      onEdit(msg);
                      setOpenMenuId(null);
                    }}
                  >
                    <span className="text-lg">✏️</span>
                    <span>Chỉnh sửa</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onRecall(msg.id);
                    setOpenMenuId(null);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 text-sm flex items-center gap-2 transition-colors"
                >
                  <span className="text-lg">🗑️</span>
                  <span>Thu hồi</span>
                </button>
              </div>
            )
          }

          {/* Menu reaction */}
          {
            reactMenuFor === msg.id && (
              <div
                ref={reactMenuRef}
                className={`msg-react-menu absolute top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 shadow-2xl rounded-full flex gap-1 px-3 py-2 border-2 border-slate-200 dark:border-slate-700 z-[60]
              ${isMe ? "right-full mr-2" : "left-full ml-2"}`}
              >
                {["❤️", "👍", "😂", "😮", "😢", "😡"].map((emo) => (
                  <button
                    key={emo}
                    className="text-2xl cursor-pointer hover:scale-125 active:scale-110 transition-transform p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => {
                      onReact(msg.id, emo);
                      setReactMenuFor(null);
                    }}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            )
          }

          {/* Reply Context Bubble (Visual Quoted Bubble) */}
          {
            isReply && replyData && !isRecalled && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReplyClick && replyData.id) onReplyClick(replyData.id);
                }}
                className={`mb-1 px-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-l-4 border-indigo-500 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-xs max-w-[280px] ${
                  isMe ? "self-end text-right border-r-4 border-l-0 border-indigo-600" : "self-start text-left"
                }`}
                title="Nhấn để xem tin nhắn gốc"
              >
                <div className={`flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                  <Reply size={12} className={isMe ? "rotate-180" : ""} />
                  <span className="truncate">{replyData.sender || "Người dùng"}</span>
                </div>
                <p className="truncate text-slate-800 dark:text-slate-200 text-xs font-normal">
                  {replyData.type === "text"
                    ? replyData.content
                    : replyData.type === "image"
                      ? "📷 Hình ảnh"
                      : "🎤 Tin nhắn thoại"}
                </p>
              </div>
            )
          }

          {/* Message bubble */}
          {
            isRecalled ? (
              <div className="italic text-slate-500 dark:text-slate-400 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm">
                Bạn đã xóa một tin nhắn
              </div>
            ) : msg.message_type === "text" ? (
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onReply && onReply(msg);
                }}
                title="Nhấn đúp để trả lời"
                className={`px-3.5 py-2 rounded-2xl text-sm shadow-sm cursor-pointer select-text transition-all ${
                  isMe
                    ? "bg-indigo-600 text-white font-normal"
                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-normal"
                } ${msg.failed ? "opacity-60" : ""}`}
              >
                <div className="leading-relaxed break-words">{msg.content}</div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  {renderMessageStatus()}
                  {msg.failed && (
                    <button
                      onClick={() => onRetry(msg)}
                      className="text-xs underline hover:opacity-80 flex items-center gap-1"
                    >
                      <RefreshCw size={12} />
                      Gửi lại
                    </button>
                  )}
                </div>
              </div>
            ) : msg.message_type === "image" ? (
              <div>
                <img
                  src={getFullImageUrl(msg.media_url)}
                  onClick={() => onImageClick(getFullImageUrl(msg.media_url))}
                  className={`rounded-xl max-w-[260px] max-h-[360px] object-cover shadow-sm cursor-pointer ${msg.failed ? "opacity-60" : ""
                    }`}
                  alt=""
                  onError={(e) => handleImageError(e, msg.media_url)}
                />
                <div className="flex items-center justify-end gap-2 mt-1">
                  {renderMessageStatus()}
                  {msg.failed && (
                    <button
                      onClick={() => onRetry(msg)}
                      className="text-xs text-red-500 underline hover:opacity-80 flex items-center gap-1"
                    >
                      <RefreshCw size={12} />
                      Gửi lại
                    </button>
                  )}
                </div>
              </div>
            ) : msg.message_type === "voice" ? (
              <div className={`px-3 py-2 rounded-2xl shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 ${msg.failed ? "opacity-60" : ""
                }`}>
                <audio controls src={msg.media_url} className="h-8" />
                {renderMessageStatus()}
                {msg.failed && (
                  <button
                    onClick={() => onRetry(msg)}
                    className="text-xs text-red-500 underline hover:opacity-80"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
              </div>
            ) : null
          }

          {/* Reaction */}
          {
            msg.reaction && !isRecalled && (
              <div
                className={`mt-1 inline-block px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-full text-base ${isMe ? "float-right mr-2" : "float-left ml-2"
                  }`}
              >
                {msg.reaction}
              </div>
            )
          }
        </div >
      </div >

      {/* Mobile Long Press Menu - Portal to document.body */}
      {
        showMobileMenu && isMobile && createPortal(
          <div
            className="fixed inset-0 bg-black/50 z-[9999] flex items-end sm:hidden"
            onClick={() => setShowMobileMenu(false)}
          >
            <div
              className="bg-white rounded-t-3xl w-full p-4 pb-8 mb-[env(safe-area-inset-bottom)] animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4"></div>

              {/* Reaction emojis */}
              <div className="flex justify-center gap-4 mb-6 pb-4 border-b">
                {["❤️", "👍", "😂", "😮", "😢", "😡"].map((emo) => (
                  <button
                    key={emo}
                    className="text-4xl hover:scale-125 active:scale-110 transition"
                    onClick={() => {
                      onReact(msg.id, emo);
                      setShowMobileMenu(false);
                    }}
                  >
                    {emo}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg flex items-center gap-3 text-base"
                  onClick={() => {
                    onReply && onReply(msg);
                    setShowMobileMenu(false);
                  }}
                >
                  <span className="text-xl">↩️</span>
                  <span>Trả lời</span>
                </button>

                {isMe && msg.message_type === "text" && (
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg flex items-center gap-3 text-base"
                    onClick={() => {
                      onEdit(msg);
                      setShowMobileMenu(false);
                    }}
                  >
                    <span className="text-xl">✏️</span>
                    <span>Chỉnh sửa tin nhắn</span>
                  </button>
                )}

                {isMe && (
                  <button
                    onClick={() => {
                      onRecall(msg.id);
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg flex items-center gap-3 text-base text-red-500"
                  >
                    <span className="text-xl">🗑️</span>
                    <span>Thu hồi tin nhắn</span>
                  </button>
                )}

                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full text-center px-4 py-3 bg-gray-100 rounded-lg font-medium text-base mt-4"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </>
  );
};

export default MessageBubble;