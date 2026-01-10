import { Verified, MapPin, Calendar, PenBox, MessageCircle } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../constants/api";
import { useState, useEffect } from "react";
import FriendButton from "./FriendButton";

const UserProfileInfo = ({ user, posts = [], profileId, setShowEdit }) => {
  const navigate = useNavigate();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    currentUser = null;
  }
  // Xác định có phải đang xem profile của chính mình không
  const isOwnProfile =
    !profileId || Number(currentUser?.id) === Number(user?.id);

  // Fetch số lượng bạn bè
  useEffect(() => {
    const fetchFriendsCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user?.id) return;

        // Fetch số bạn bè của user đang xem (có thể là mình hoặc người khác)
        const response = await axios.get(
          `${API_URL}/friendships/count/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.success) {
          setFriendsCount(response.data.count || 0);
        }
      } catch (error) {
        console.error("Fetch friends count error:", error);
      }
    };

    fetchFriendsCount();
  }, [user?.id]);

  // Hàm tạo chat và chuyển đến trang nhắn tin
  const handleSendMessage = async () => {
    if (!user?.id || !currentUser?.id) {
      toast.error("Không thể tạo cuộc trò chuyện");
      return;
    }

    setIsCreatingChat(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập");
        navigate("/");
        return;
      }

      // Gọi API tạo hoặc lấy chat
      const response = await axios.post(
        `${API_URL}/chat/dm`,
        { receiverId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatId = response.data?.chatId;

      if (chatId) {
        // Chuyển đến trang chat với chatId
        navigate(`/messages/${chatId}`);
      } else {
        toast.error("Không thể tạo cuộc trò chuyện");
      }
    } catch (error) {
      console.error("Create chat error:", error);
      toast.error(error.response?.data?.message || "Không thể tạo cuộc trò chuyện");
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="relative py-4 px-6 md:px-8 bg-white">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Avatar */}
        <div className="w-32 h-32 border-4 border-white shadow-lg absolute -top-16 rounded-full overflow-hidden">
          <img
            src={
              user.avatar ||
              `/default.jpg`
            }
            alt="avatar"
            className="w-full h-full object-cover rounded-full"
          />

        </div>

        <div className="w-full pt-16 md:pt-0 md:pl-36">
          <div className="flex flex-col md:flex-row items-start justify-between gap-3">
            {/* Name + username */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.full_name || "Chưa có tên"}
                </h1>
                <Verified className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-gray-600">
                {user.username ? `@${user.username}` : "Thêm tên người dùng"}
              </p>
            </div>

            {/* Buttons */}
            {isOwnProfile ? (
              <div className="flex flex-row gap-3">
                {/* Edit button */}
                <button
                  onClick={() => setShowEdit?.(true)}
                  className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium mt-4 md:mt-0"
                >
                  <PenBox className="w-4 h-4" />
                  Chỉnh sửa
                </button>

                {/* Đổi mật khẩu - Hidden on mobile */}
                <button
                  onClick={() => navigate("/change-password")}
                  className="max-sm:hidden flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium mt-4 md:mt-0"
                >
                  Đổi mật khẩu
                </button>
              </div>
            ) : (
              <div className="flex flex-row gap-3">
                <FriendButton userId={user.id} currentUserId={currentUser?.id} />

                {/* Message button - Chỉ hiện khi xem profile người khác */}
                <button
                  onClick={handleSendMessage}
                  disabled={isCreatingChat}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium mt-4 md:mt-0 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  {isCreatingChat ? "Đang tải..." : "Nhắn tin"}
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          <p className="text-gray-700 text-sm max-w-md mt-4">
            {user.bio || "Chưa có tiểu sử"}
          </p>

          {/* Location + joined time */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 mt-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {user.address || "Chưa có địa chỉ"}
            </span>

            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Tham gia{" "}
              <span className="font-medium">
                {user.created_at
                  ? dayjs(user.created_at).fromNow()
                  : "không rõ"}
              </span>
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6 border-t border-gray-200 pt-4">
            <div>
              <span className="sm:text-xl font-bold text-gray-900">
                {posts.length}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 ml-1.5">
                Bài viết
              </span>
            </div>

            <div>
              <span className="sm:text-xl font-bold text-gray-900">
                {friendsCount}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 ml-1.5">
                Bạn bè
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;