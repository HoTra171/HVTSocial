import {
  Check,
  CheckCheck,
  AlertCircle,
  RefreshCw,
  Smile,
  MoreVertical
} from "lucide-react";

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
    <div
      className={`flex w-full mb-1 ${isMe ? "justify-end" : "justify-start"
        }`}
    >
      {/* Avatar người gửi (không phải mình) */}
      {!isMe && (
        <img
          src={
            partner?.avatar ||
            `/default.jpg`
          }

          className="w-8 h-8 rounded-full mr-2 self-end"
        />
      )}

      <div className="relative max-w-[80%] group">
        {/* Icon bar (emoji + menu) */}
        {!msg.recalled && !msg.failed && (
          <div
            className={`msg-icon-bar absolute top-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition
              ${isMe ? "left-[-70px]" : "right-[-70px]"}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setReactMenuFor(reactMenuFor === msg.id ? null : msg.id);
                setOpenMenuId(null);
              }}
              className="p-1 bg-white shadow rounded-full text-gray-600 hover:text-black"
            >
              <Smile size={20} />
            </button>

            {isMe && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === msg.id ? null : msg.id);
                  setReactMenuFor(null);
                }}
                className="p-1 bg-white shadow rounded-full text-gray-600 hover:text-black"
              >
                <MoreVertical size={20} />
              </button>
            )}
          </div>
        )}

        {/* Menu 3 chấm */}
        {openMenuId === msg.id && (
          <div className="msg-menu absolute left-[-170px] top-0 bg-white shadow-lg rounded-lg w-40 p-2 z-50 border">
            {msg.message_type === "text" && (
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-100"
                onClick={() => {
                  onEdit(msg);
                  setOpenMenuId(null);
                }}
              >
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={() => {
                onRecall(msg.id);
                setOpenMenuId(null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500"
            >
              Thu hồi
            </button>
          </div>
        )}

        {/* Menu reaction */}
        {reactMenuFor === msg.id && (
          <div className="msg-react-menu absolute -top-12 left-[-10px] bg-white shadow-xl rounded-full flex gap-2 px-3 py-2 border z-50">
            {["❤️", "👍", "😂", "😢", "😡"].map((emo) => (
              <span
                key={emo}
                className="text-2xl cursor-pointer hover:scale-125 transition"
                onClick={() => {
                  onReact(msg.id, emo);
                  setReactMenuFor(null);
                }}
              >
                {emo}
              </span>
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
              src={msg.media_url}
              onClick={() => onImageClick(msg.media_url)}
              className={`rounded-xl max-w-[260px] max-h-[360px] object-cover shadow cursor-pointer ${msg.failed ? "opacity-60" : ""
                }`}
              alt=""
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
  );
};

export default MessageBubble;