import React from 'react';
import { MapPin, MessageCircle, Users, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FriendButton from './FriendButton';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../constants/api';

const GRADIENTS = [
  'from-indigo-600 via-indigo-500 to-purple-600',
  'from-blue-600 via-cyan-500 to-teal-500',
  'from-violet-600 via-purple-500 to-pink-500',
  'from-fuchsia-600 via-pink-500 to-rose-500',
  'from-emerald-500 via-teal-500 to-cyan-600',
  'from-amber-500 via-orange-500 to-rose-500',
];

const UserCard = ({ user, currentUser }) => {
  const navigate = useNavigate();

  const userId = user._id || user.id;
  const currentUserId = currentUser?.id;

  const followersCount = Array.isArray(user.followers)
    ? user.followers.length
    : typeof user.followers_count === 'number'
      ? user.followers_count
      : 0;

  const avatar = user.profile_picture || user.avatar || `/default.jpg`;
  const isFriend = user.isFriend || false;

  // Chọn gradient cố định theo ID người dùng
  const gradientIndex = (Number(userId) || 0) % GRADIENTS.length;
  const coverGradient = GRADIENTS[gradientIndex];

  const openDirectChat = async (e) => {
    e?.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token || !currentUserId) return toast.error('Bạn chưa đăng nhập');

    try {
      const dmRes = await axios.post(
        `${API_URL}/chat/dm`,
        { receiverId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatId = dmRes.data?.chatId;
      if (!chatId) return toast.error('Không lấy được chatId');

      navigate(`/messages/${chatId}`);
    } catch (err) {
      console.error('openDirectChat error:', err);
      toast.error(err.response?.data?.error || 'Không mở được đoạn chat');
    }
  };

  return (
    <div
      className="group relative flex flex-col justify-between w-full bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => navigate(`/profile/${userId}`)}
    >
      {/* Cover Banner */}
      <div className="relative h-24 w-full overflow-hidden bg-gray-100">
        {user.cover_photo ? (
          <img
            src={user.cover_photo}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${coverGradient} opacity-90`} />
        )}
      </div>

      {/* Avatar (Overlapping Cover) */}
      <div className="relative px-5 -mt-10 flex flex-col items-center text-center">
        <div className="relative inline-block">
          <img
            src={avatar}
            alt={user.full_name}
            onError={(e) => {
              e.currentTarget.src = '/default.jpg';
            }}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md group-hover:scale-105 transition-transform duration-300"
          />
          {user.is_verified && (
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm">
              <CheckCircle className="w-5 h-5 text-indigo-600 fill-white" />
            </div>
          )}
        </div>

        {/* User Info */}
        <h3 className="mt-3 font-bold text-base text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {user.full_name || user.name || 'Người dùng'}
        </h3>

        {user.username && (
          <p className="text-gray-400 font-medium text-xs mt-0.5">
            @{user.username}
          </p>
        )}

        {user.bio ? (
          <p className="text-gray-600 mt-2 text-xs line-clamp-2 px-1 leading-relaxed">
            {user.bio}
          </p>
        ) : (
          <p className="text-gray-400 mt-2 text-xs italic">Chưa có tiểu sử</p>
        )}

        {/* Chips / Stats */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 w-full">
          {user.mutual_friends_count > 0 && (
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <Users className="w-3 h-3 text-indigo-600" />
              <span>{user.mutual_friends_count} bạn chung</span>
            </div>
          )}

          {(user.location || user.address) && (
            <div className="flex items-center gap-1 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full text-[11px] font-medium border border-gray-100">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="truncate max-w-[120px]">{user.location || user.address}</span>
            </div>
          )}

          {followersCount > 0 && (
            <div className="flex items-center gap-1 bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full text-[11px] font-medium border border-gray-100">
              <span className="font-semibold text-gray-900">{followersCount}</span>
              <span>người theo dõi</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="p-5 pt-4 mt-2 border-t border-gray-50 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1">
          <FriendButton userId={userId} currentUserId={currentUserId} fullWidth={true} />
        </div>

        {/* Message Button if friends */}
        {isFriend && (
          <button
            onClick={openDirectChat}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all active:scale-95 shadow-sm"
            title="Gửi tin nhắn"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default UserCard;
