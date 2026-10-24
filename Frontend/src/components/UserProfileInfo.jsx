import React, { useState, useEffect } from "react";
import {
  Verified,
  MapPin,
  Calendar,
  PenBox,
  MessageCircle,
  KeyRound,
  Eye,
  Camera,
  Users,
  FileText,
  Image as ImageIcon,
  Cake,
  ShieldCheck,
  Radio,
} from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../constants/api";
import FriendButton from "./FriendButton";
import { liveStreamApi } from "../api/liveStreamApi";
import { useSocket } from "../contexts";

const GENDER_LABELS = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

const UserProfileInfo = ({
  user,
  posts = [],
  profileId,
  setShowEdit,
  onViewAvatar,
  onTabChange,
  activeTab,
  mediaCount = 0,
}) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [activeLiveStream, setActiveLiveStream] = useState(null);

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    currentUser = null;
  }

  const isOwnProfile = !profileId || Number(currentUser?.id) === Number(user?.id);

  // Kiểm tra trạng thái phát trực tiếp của người dùng
  useEffect(() => {
    let isMounted = true;
    const fetchLiveStatus = async () => {
      if (!user?.id) return;
      try {
        const res = await liveStreamApi.getUserStatus(user.id);
        if (isMounted) {
          if (res?.data?.is_live && res?.data?.stream) {
            setActiveLiveStream(res.data.stream);
          } else {
            setActiveLiveStream(null);
          }
        }
      } catch (err) {
        console.error("Check user live status error:", err);
      }
    };

    fetchLiveStatus();

    const handleNewLive = (stream) => {
      if (Number(stream.user_id) === Number(user?.id)) {
        setActiveLiveStream(stream);
      }
    };
    const handleLiveEnded = ({ userId }) => {
      if (Number(userId) === Number(user?.id)) {
        setActiveLiveStream(null);
      }
    };

    socket?.on("new_livestream_started", handleNewLive);
    socket?.on("user_livestream_ended", handleLiveEnded);

    return () => {
      isMounted = false;
      socket?.off("new_livestream_started", handleNewLive);
      socket?.off("user_livestream_ended", handleLiveEnded);
    };
  }, [user?.id, socket]);

  // Fetch số lượng bạn bè
  useEffect(() => {
    let isMounted = true;
    const fetchFriendsCount = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user?.id) return;

        const response = await axios.get(`${API_URL}/friendships/count/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success && isMounted) {
          setFriendsCount(response.data.count || 0);
        }
      } catch (error) {
        console.error("Fetch friends count error:", error);
      }
    };

    fetchFriendsCount();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Handle direct message creation
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

      const response = await axios.post(
        `${API_URL}/chat/dm`,
        { receiverId: user.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatId = response.data?.chatId;
      if (chatId) {
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

  const avatarUrl = user?.avatar || "/default.jpg";

  return (
    <div className="relative px-4 sm:px-8 pb-6 bg-white border-b border-slate-100">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
        {/* Floating Avatar */}
        <div className="relative -mt-20 sm:-mt-24 flex-shrink-0 group">
          <div
            onClick={() => {
              if (activeLiveStream) {
                navigate(isOwnProfile ? `/live/broadcast/${activeLiveStream.id}` : `/live/${activeLiveStream.id}`);
              } else {
                onViewAvatar?.(avatarUrl);
              }
            }}
            className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 ${
              activeLiveStream
                ? "border-rose-500 ring-4 ring-rose-400/50 shadow-rose-300"
                : "border-white"
            } shadow-xl overflow-hidden bg-slate-100 cursor-pointer relative transition-all`}
            title={activeLiveStream ? "Đang phát trực tiếp - Nhấn để xem ngay" : "Nhấn để xem ảnh đại diện"}
          >
            <img
              src={avatarUrl}
              alt={user?.full_name || "avatar"}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
              {activeLiveStream ? (
                <>
                  <Radio className="w-6 h-6 mb-1 text-rose-400 drop-shadow animate-pulse" />
                  <span className="text-[11px] font-bold drop-shadow">Xem trực tiếp</span>
                </>
              ) : (
                <>
                  <Eye className="w-6 h-6 mb-1 drop-shadow" />
                  <span className="text-[11px] font-semibold drop-shadow">Xem ảnh</span>
                </>
              )}
            </div>
          </div>

          {/* Pulsing Live Badge directly under avatar */}
          {activeLiveStream && (
            <button
              type="button"
              onClick={() => navigate(isOwnProfile ? `/live/broadcast/${activeLiveStream.id}` : `/live/${activeLiveStream.id}`)}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-rose-300 border-2 border-white animate-pulse cursor-pointer whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>TRỰC TIẾP</span>
            </button>
          )}

          {/* Quick Edit Avatar Button for Own Profile */}
          {isOwnProfile && !activeLiveStream && (
            <button
              type="button"
              onClick={() => setShowEdit?.(true)}
              className="absolute bottom-1 right-1 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow-md border-2 border-white transition active:scale-95 cursor-pointer"
              title="Chỉnh sửa hồ sơ & ảnh đại diện"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Information */}
        <div className="w-full text-center md:text-left pt-2 md:pt-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              {/* Name & Badges */}
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {user?.full_name || user?.name || "Người dùng"}
                </h1>
                <Verified className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 fill-indigo-50 flex-shrink-0" />
                {user?.profile_visibility === "private" && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex items-center gap-1 border border-slate-200">
                    <ShieldCheck className="w-3 h-3 text-slate-500" />
                    <span>Riêng tư</span>
                  </span>
                )}
                {activeLiveStream && (
                  <button
                    type="button"
                    onClick={() => navigate(isOwnProfile ? `/live/broadcast/${activeLiveStream.id}` : `/live/${activeLiveStream.id}`)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition cursor-pointer"
                    title="Người dùng đang phát trực tiếp"
                  >
                    <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    <span>ĐANG LIVE</span>
                  </button>
                )}
              </div>

              {/* Username */}
              <p className="text-slate-500 text-sm font-medium mt-0.5">
                {user?.username ? `@${user.username}` : "Chưa đặt username"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center md:justify-end gap-2.5 flex-wrap">
              {activeLiveStream && (
                <button
                  type="button"
                  onClick={() => navigate(isOwnProfile ? `/live/broadcast/${activeLiveStream.id}` : `/live/${activeLiveStream.id}`)}
                  className="h-10 px-5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer animate-pulse"
                >
                  <Radio className="w-4 h-4" />
                  <span>{isOwnProfile ? "Studio của bạn" : "Xem phát trực tiếp"}</span>
                </button>
              )}

              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowEdit?.(true)}
                    className="h-10 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <PenBox className="w-4 h-4" />
                    <span>Chỉnh sửa hồ sơ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/change-password")}
                    className="h-10 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 font-semibold text-sm transition-all shadow-xs flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    title="Đổi mật khẩu tài khoản"
                  >
                    <KeyRound className="w-4 h-4 text-slate-500" />
                    <span className="max-xs:hidden">Đổi mật khẩu</span>
                  </button>
                </>
              ) : (
                <>
                  <FriendButton
                    userId={user?.id}
                    currentUserId={currentUser?.id}
                    fullWidth={false}
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={isCreatingChat}
                    className="h-10 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isCreatingChat ? "Đang mở..." : "Nhắn tin"}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bio */}
          {user?.bio && (
            <p className="text-slate-700 text-sm mt-3 leading-relaxed max-w-2xl font-normal whitespace-pre-line">
              {user.bio}
            </p>
          )}

          {/* User Details Row */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-500 mt-4">
            {user?.address && (
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{user.address}</span>
              </span>
            )}

            {user?.date_of_birth && (
              <span className="flex items-center gap-1.5 font-medium">
                <Cake className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>
                  Sinh ngày {dayjs(user.date_of_birth).format("DD/MM/YYYY")}
                </span>
              </span>
            )}

            {user?.gender && GENDER_LABELS[user.gender] && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200">
                {GENDER_LABELS[user.gender]}
              </span>
            )}

            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>
                Tham gia {user?.created_at ? dayjs(user.created_at).fromNow() : "gần đây"}
              </span>
            </span>
          </div>

          {/* Stats Counters */}
          <div className="flex items-center justify-center md:justify-start gap-6 sm:gap-8 mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onTabChange?.("posts")}
              className={`flex items-center gap-2 group transition cursor-pointer ${
                activeTab === "posts" ? "text-indigo-600" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              <span className="text-base sm:text-lg font-bold">{posts.length}</span>
              <span className="text-xs sm:text-sm text-slate-500 font-normal">Bài viết</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange?.("friends")}
              className={`flex items-center gap-2 group transition cursor-pointer ${
                activeTab === "friends" ? "text-indigo-600" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              <span className="text-base sm:text-lg font-bold">{friendsCount}</span>
              <span className="text-xs sm:text-sm text-slate-500 font-normal">Bạn bè</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange?.("media")}
              className={`flex items-center gap-2 group transition cursor-pointer ${
                activeTab === "media" ? "text-indigo-600" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              <span className="text-base sm:text-lg font-bold">{mediaCount}</span>
              <span className="text-xs sm:text-sm text-slate-500 font-normal">Ảnh & Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;