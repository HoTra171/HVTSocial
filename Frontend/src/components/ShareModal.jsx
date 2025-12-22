import { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const ShareModal = ({ post, onClose, onSuccess }) => {
  const [chatList, setChatList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("");

  const getAuth = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id;
    const token = localStorage.getItem("token");
    return { userId, token };
  };

  const { userId } = getAuth();

  console.log("User Id là: " + userId)

  useEffect(() => {
    // Lấy danh sách chat của user (cần token)
    const { userId, token } = getAuth();
    if (!userId || !token) return;

    axios
      .get(`http://localhost:5000/api/chat/user/${userId}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setChatList(res.data))
      .catch(console.error);
  }, []);



  const handleShare = async () => {
    try {
      const { userId, token } = getAuth();
      if (!userId || !token) return toast.error("Bạn chưa đăng nhập");

      const defaultContent =
        `Chia sẻ bài viết: ${post?.content?.substring(0, 50) || ""}...`;
      await Promise.all(
        selected.map((chatId) =>
          axios.post(
            "http://localhost:5000/api/chat/send",
            {
              chatId,
              senderId: userId,
              content: message || defaultContent,
              message_type: "shared_post",
              media_url: JSON.stringify({
                postId: post?.id,
                content: post?.content,
                images: post?.image_urls || post?.images || [],
                userId: post?.user?.id || post?.user_id,
                userName: post?.user?.full_name || post?.full_name,
              }),
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      toast.success(`Đã chia sẻ tới ${selected.length} cuộc trò chuyện`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Chia sẻ thất bại");
    }
  };

  const handleShareTimeline = async () => {
    try {
      const { token } = getAuth();
      if (!token) return toast.error("Bạn chưa đăng nhập");

      await axios.post(
        "http://localhost:5000/api/shares",
        { postId: post?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Đã chia sẻ lên trang cá nhân");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Share timeline error:", err);
      toast.error("Chia sẻ thất bại");
    }
  };

  // phần JSX giữ nguyên, chỉ dùng lại 2 hàm trên
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">Chia sẻ bài viết</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* <div className="p-4 border-b">
          <button
            onClick={handleShareTimeline}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Chia sẻ lên trang cá nhân
          </button>
        </div> */}

        <div className="p-4">
          <h4 className="font-semibold mb-3">Gửi qua tin nhắn</h4>

          <div className="max-h-64 overflow-y-auto mb-3 space-y-2">
            {chatList.map((chat) => (
              <label
                key={`chat-${chat.chat_id}`}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(chat.chat_id)}
                  onChange={(e) => {
                    // Chọn / bỏ chọn cuộc trò chuyện để gửi bài viết
                    const checked = e.target.checked;
                    const id = chat.chat_id;

                    setSelected((prev) =>
                      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id)
                    );
                  }}

                  className="w-4 h-4"
                />

                <img
                  src={chat.avatar || (chat.is_group_chat ? "/group.png" : "/default.jpg")}
                  className="w-10 h-10 rounded-full"
                  alt=""
                />

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{chat.target_name}</p>
                  <p className="text-xs text-gray-500 truncate">{chat.last_message}</p>
                </div>
              </label>
            ))}
          </div>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Thêm tin nhắn (tùy chọn)..."
            className="w-full p-2 border rounded-lg mb-3"
          />

          <button
            onClick={handleShare}
            disabled={selected.length === 0}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Gửi ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
