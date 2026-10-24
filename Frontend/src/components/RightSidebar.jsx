import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Sparkles, ExternalLink, RefreshCw, Radio } from 'lucide-react';
import { userApi } from '../api/userApi';
import { assets } from '../assets/assets';
import FriendButton from './FriendButton';
import { liveStreamApi } from '../api/liveStreamApi';
import { useSocket } from '../contexts';

export const RightSidebar = ({ currentUser }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [suggestions, setSuggestions] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeLiveStreams, setActiveLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveStreams = async () => {
    try {
      const res = await liveStreamApi.getActive();
      if (Array.isArray(res?.data)) {
        setActiveLiveStreams(res.data);
      }
    } catch (err) {
      console.error('Error fetching live streams in RightSidebar:', err);
    }
  };

  const fetchSidebarData = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      fetchLiveStreams();

      // Fetch suggested users (not friends)
      const resSuggestions = await userApi.discover({ search: '', filterType: 'not-friends' }).catch(() => null);
      if (resSuggestions?.data?.success || Array.isArray(resSuggestions?.data?.data)) {
        const list = resSuggestions.data.data || [];
        setSuggestions(list.filter((u) => u.id !== currentUser.id).slice(0, 5));
      }

      // Fetch friends for online contacts
      const resConnections = await userApi.getConnections(currentUser.id).catch(() => null);
      if (resConnections?.data) {
        const friendList = resConnections.data.friends || resConnections.data.connections || resConnections.data.following || [];
        setFriends(friendList.slice(0, 8));
      }
    } catch (err) {
      console.error('Error fetching sidebar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarData();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!socket) return;
    const handleNewLive = (newStream) => {
      setActiveLiveStreams((prev) => {
        if (prev.some((s) => s.id === newStream.id)) return prev;
        return [newStream, ...prev];
      });
    };

    const handleLiveEnded = ({ streamId }) => {
      setActiveLiveStreams((prev) => prev.filter((s) => s.id !== streamId));
    };

    socket.on('new_livestream_started', handleNewLive);
    socket.on('livestream_ended', handleLiveEnded);
    socket.on('user_livestream_ended', handleLiveEnded);

    return () => {
      socket.off('new_livestream_started', handleNewLive);
      socket.off('livestream_ended', handleLiveEnded);
      socket.off('user_livestream_ended', handleLiveEnded);
    };
  }, [socket]);

  return (
    <div className="max-xl:hidden w-80 flex-shrink-0">
      <div className="sticky top-10 self-start flex flex-col gap-5 pb-10">

        {/* 0. LIVE STREAM WIDGET (Hiện khi có buổi phát trực tiếp) */}
        {activeLiveStreams.length > 0 && (
          <div className="bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-purple-500/10 dark:from-rose-950/30 dark:to-purple-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-rose-100 dark:border-rose-900/30 mb-2.5">
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-rose-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Đang phát trực tiếp
                </h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 bg-rose-100 dark:bg-rose-900/50 dark:text-rose-300 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                {activeLiveStreams.length} Live
              </span>
            </div>

            <div className="space-y-2">
              {activeLiveStreams.map((stream) => (
                <Link
                  key={stream.id}
                  to={`/live/${stream.id}`}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 border border-rose-100 dark:border-rose-950/60 transition shadow-xs group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={stream.user_avatar || '/default.jpg'}
                      alt={stream.user_name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-500"
                    />
                    <span className="absolute -bottom-1 -right-1 px-1 bg-rose-600 text-[8px] text-white font-extrabold rounded">
                      LIVE
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-rose-600 transition">
                      {stream.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {stream.user_name} • {stream.viewer_count || 1} người xem
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 1. GỢI Ý KẾT BẠN (Suggested for you - Instagram/Facebook style) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Gợi ý cho bạn
              </h3>
            </div>
            <Link
              to="/discover"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-1">
            {suggestions.length > 0 ? (
              suggestions.map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between gap-2.5">
                  <Link
                    to={`/profile/${u.id}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 group"
                  >
                    <img
                      src={u.avatar || u.profile_picture || '/default.jpg'}
                      alt={u.full_name || u.username}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0 group-hover:opacity-90 transition"
                      onError={(e) => {
                        e.currentTarget.src = '/default.jpg';
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition">
                        {u.full_name || u.username}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        @{u.username}
                      </p>
                    </div>
                  </Link>

                  <div className="flex-shrink-0">
                    <FriendButton
                      userId={u.id}
                      currentUserId={currentUser?.id}
                      onStatusChange={() => {
                        // refresh sau khi kết bạn
                        setTimeout(fetchSidebarData, 500);
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                Đang tìm thêm bạn bè xung quanh...
              </p>
            )}
          </div>
        </div>

        {/* 2. NGƯỜI LIÊN HỆ ĐANG HOẠT ĐỘNG (Online Contacts - Facebook style) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Người liên hệ
              </h3>
            </div>
            <Link
              to="/messages"
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition"
              title="Mở Messenger"
            >
              <MessageSquare size={16} />
            </Link>
          </div>

          <div className="space-y-1 pt-2">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => navigate(`/messages/${friend.id}`)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition group"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={friend.avatar || friend.profile_picture || '/default.jpg'}
                      alt={friend.full_name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      onError={(e) => {
                        e.currentTarget.src = '/default.jpg';
                      }}
                    />
                    {/* Active green status dot */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition">
                      {friend.full_name || friend.username}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                Chưa có người liên hệ nào trực tuyến
              </p>
            )}
          </div>
        </div>

        {/* 3. TIN TÀI TRỢ / COMMUNITY (Sleek modern card) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Được tài trợ
            </span>
            <ExternalLink size={12} className="text-slate-400" />
          </div>
          <div className="rounded-xl overflow-hidden aspect-video bg-slate-100 relative group cursor-pointer">
            <img
              src={assets.sponsored_img || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600'}
              alt="Sponsored"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            HVTSocial Cloud Platform
          </p>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Mạng xã hội thế hệ mới kết nối bạn bè, chia sẻ câu chuyện và gắn kết cộng đồng.
          </p>
        </div>

        {/* 4. FOOTER LINKS (Instagram/Facebook style) */}
        <div className="px-2 text-[11px] text-slate-400 space-y-1.5 leading-normal">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <Link to="/privacy-settings" className="hover:underline">Quyền riêng tư</Link>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Điều khoản</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Quảng cáo</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Trợ giúp</span>
          </div>
          <p>© 2026 HVTSocial from Hồ Viết Trà</p>
        </div>

      </div>
    </div>
  );
};

export default RightSidebar;
