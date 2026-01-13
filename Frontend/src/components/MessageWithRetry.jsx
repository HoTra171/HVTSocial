import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  CheckCheck,
  AlertCircle,
  RefreshCw,
  Smile,
  MoreVertical
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
  onImageClick,
  openMenuId,
  setOpenMenuId,
  reactMenuFor,
  setReactMenuFor
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const longPressTimer = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const menuRef = useRef(null);
  const reactMenuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
      if (reactMenuRef.current && !reactMenuRef.current.contains(event.target)) {
        setReactMenuFor(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setOpenMenuId, setReactMenuFor]);

  const handleTouchStart = (e) => {
    if (!isMobile || msg.recalled || msg.failed) return;

    longPressTimer.current = setTimeout(() => {
      setShowMobileMenu(true);
      // Haptic feedback on supported devices
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };
  // Render status icon cho tin nhắn của mình
  const renderMessageStatus = () => {
    if (!isMe) return null;

    if (msg.failed) {
      return (
        <div className="flex items-center gap-1 text-red-500">
          <AlertCircle size={14} />
          <span className="text-xs">Gửi thất bại</span>
        </div>
      );
    }

    if (msg.status === "read") {
      return <CheckCheck size={14} className="text-blue-500" />;
    } else if (msg.status === "delivered") {
      return <CheckCheck size={14} className="text-gray-400" />;
    } else {
      return <Check size={14} className="text-gray-400" />;
    }
  };

  return (
    <>
      <div
        className={`flex w-full mb-1 ${isMe ? "justify-end" : "justify-start"
          }`}
      >
        {/* Avatar người gửi (không phải mình) */}
        {!isMe && !msg.recalled && (
          <img
            src={
              partner?.avatar ||
              `/default.jpg`
            }

            className="w-8 h-8 rounded-full mr-2 self-end"
          />
        )}

        <div
          className="relative max-w-[80%] group select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          {/* Icon bar (emoji + menu) - Desktop only */}
          {!msg.recalled && !msg.failed && (
            <div
              className={`max-sm:hidden msg-icon-bar absolute top-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200
              ${isMe ? "left-[-80px]" : "right-[-80px]"}`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setReactMenuFor(reactMenuFor === msg.id ? null : msg.id);
                  setOpenMenuId(null);
                }}
                className="p-1.5 bg-white shadow-md rounded-full text-gray-600 hover:text-yellow-500 hover:bg-yellow-50 transition-all"
                title="Thả cảm xúc"
              >
                <Smile size={18} />
              </button>

              {isMe && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                    setReactMenuFor(null);
                  }}
                  className="p-1.5 bg-white shadow-md rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                  title="Tùy chọn"
                >
                  <MoreVertical size={18} />
                </button>
              )}
            </div>
          )}

          {/* Menu 3 chấm - Improved positioning */}
          {openMenuId === msg.id && (
            <div
              ref={menuRef}
              className={`msg-menu absolute top-0 bg-white shadow-xl rounded-lg py-1 z-50 border border-gray-200 min-w-[150px]
              ${isMe ? "left-[-160px]" : "right-[-160px]"}`}
            >
              {msg.message_type === "text" && (
                <button
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm flex items-center gap-2 transition-colors"
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
                className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-500 text-sm flex items-center gap-2 transition-colors"
              >
                <span className="text-lg">🗑️</span>
                <span>Thu hồi</span>
              </button>
            </div>
          )}

          {/* Menu reaction - Improved positioning and styling */}
          {reactMenuFor === msg.id && (
            <div
              ref={reactMenuRef}
              className={`msg-react-menu absolute bottom-full mb-2 bg-white shadow-2xl rounded-full flex gap-1 px-3 py-2.5 border-2 border-gray-100 z-[60]
              ${isMe ? "right-0" : "left-0"}`}
            >
              {["❤️", "👍", "😂", "😮", "😢", "😡"].map((emo) => (
                <button
                  key={emo}
                  className="text-2xl cursor-pointer hover:scale-125 active:scale-110 transition-transform p-1 rounded-full hover:bg-gray-100"
                  onClick={() => {
                    onReact(msg.id, emo);
                    setReactMenuFor(null);
                  }}
                >
                  {emo}
                </button>
              ))}
            </div>
          )}

          {/* Message bubble */}
          {msg.recalled ? (
            <div className="italic opacity-60 px-3 py-2 bg-gray-200 rounded-2xl text-sm">
              Tin nhắn đã thu hồi
            </div>
          ) : msg.message_type === "text" ? (
            <div
              className={`px-3 py-2 rounded-2xl text-sm shadow ${isMe ? "bg-blue-600 text-white" : "bg-white text-black"
                } ${msg.failed ? "opacity-60" : ""}`}
            >
              <div>{msg.content}</div>
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
                className={`rounded-xl max-w-[260px] max-h-[360px] object-cover shadow cursor-pointer ${msg.failed ? "opacity-60" : ""
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
            <div className={`px-3 py-2 rounded-2xl shadow bg-white flex items-center gap-2 ${msg.failed ? "opacity-60" : ""
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
          ) : null}

          {/* Reaction */}
          {msg.reaction && !msg.recalled && (
            <div
              className={`mt-1 inline-block px-2 bg-white shadow rounded-full text-lg ${isMe ? "float-right mr-2" : "float-left ml-2"
                }`}
            >
              {msg.reaction}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Long Press Menu - Portal to document.body */}
      {showMobileMenu && isMobile && createPortal(
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
      )}
    </>
  );
};

export default MessageBubble;