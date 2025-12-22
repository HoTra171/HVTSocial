import React from 'react';
import { MapPin, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FriendButton from './FriendButton';
import axios from "axios";
import toast from "react-hot-toast";

const UserCard = ({ user, currentUser }) => {
  const navigate = useNavigate();

  // // Hỗ trợ cả _id và id
  const userId = user._id || user.id;
  const currentUserId = currentUser?.id;

  // Đếm người theo dõi (nếu có)
  const followersCount = Array.isArray(user.followers)
    ? user.followers.length
    : typeof user.followers_count === 'number'
      ? user.followers_count
      : 0;

  // Avatar
  const avatar = user.profile_picture || user.avatar || `/default.jpg`;

  // Đã là bạn bè hay chưa
  const isFriend = user.isFriend || false;

  // nhắn tin
  const openDirectChat = async () => {
    const token = localStorage.getItem("token");
    if (!token || !currentUserId) return toast.error("Bạn chưa đăng nhập");

    try {
      // tạo hoặc lấy phòng 1-1
      const dmRes = await axios.post(
        "http://localhost:5000/api/chat/dm",
        { receiverId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatId = dmRes.data?.chatId;
      if (!chatId) return toast.error("Không lấy được chatId");

      navigate(`/messages/${chatId}`);
    } catch (err) {
      console.error("openDirectChat error:", err);
      toast.error(err.response?.data?.error || "Không mở được đoạn chat");
    }
  };


  return (
    <div className="p-5 pt-6 flex flex-col justify-between w-72 shadow-md hover:shadow-xl 
    border border-gray-200 rounded-xl transition-all duration-200 bg-white">
      {/* Avatar + Info */}
      <div className="text-center">
        <img
          src={avatar}
          alt={user.full_name}
          className="rounded-full w-20 h-20 shadow-md mx-auto cursor-pointer 
          hover:scale-105 transition-transform"
          onClick={() => navigate(`/profile/${userId}`)}
        />

        <p
          className="mt-4 font-semibold text-lg text-slate-800 cursor-pointer 
          hover:text-indigo-600 transition"
          onClick={() => navigate(`/profile/${userId}`)}
        >
          {user.full_name || user.name || 'Người dùng'}
        </p>

        {user.username && (
          <p className="text-gray-500 font-light text-sm">@{user.username}</p>
        )}

        {user.bio && (
          <p className="text-gray-600 mt-2 text-center text-sm px-2 line-clamp-2">
            {user.bio}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">
        {(user.location || user.address) && (
          <div className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1.5">
            <MapPin className="w-3 h-3" />
            {user.location || user.address}
          </div>
        )}

        {followersCount > 0 && (
          <div className="flex items-center gap-1 border border-gray-300 rounded-full px-3 py-1.5">
            <span className="font-medium">{followersCount}</span>
            <span>người theo dõi</span>
          </div>
        )}

        {isFriend && (
          <div className="flex items-center gap-1 bg-green-50 border border-green-200 
          text-green-700 rounded-full px-3 py-1.5 font-medium">
            Bạn bè
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex mt-5 gap-2">
        {/* FriendButton - Hiển thị đúng trạng thái */}
        <div className="flex-1">
          <FriendButton userId={userId} currentUserId={currentUserId} />
        </div>

        {/* Message Button - chỉ hiện khi đã là bạn bè */}
        {isFriend && (
          <button
            onClick={openDirectChat}
            className="flex items-center justify-center w-12 h-12 border-2 border-indigo-200
            text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer 
            active:scale-95 transition-all"
            title="Nhắn tin"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* View Profile Link */}
      <button
        onClick={() => navigate(`/profile/${userId}`)}
        className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 
        font-medium hover:underline"
      >
        Xem trang cá nhân
      </button>
    </div>
  );
};

export default UserCard;
