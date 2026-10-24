import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/vi';
import {
  Heart,
  FileText,
  Image as ImageIcon,
  Bookmark,
  Lock,
  Camera,
  Eye,
  Users,
  MapPin,
  Calendar,
  Cake,
  Sparkles,
  Shield,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../api/userApi';
import { postApi } from '../api/postApi';
import UserProfileInfo from '../components/UserProfileInfo';
import PostCard from '../components/post/PostCard';
import ProfileModal from '../components/ProfileModal';
import ImageLightbox from '../components/common/ImageLightbox';
import { PostSkeleton } from '../components/common/SkeletonLoader';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.locale('vi');

const GENDER_LABELS = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
};

const Profile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const validTargetUserId =
    profileId && profileId !== 'undefined' && !isNaN(Number(profileId))
      ? Number(profileId)
      : currentUser?.id || null;

  const isOwnProfile = !profileId || Number(currentUser?.id) === Number(validTargetUserId);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEdit, setShowEdit] = useState(false);

  // Friends & Connections
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');

  // Saved / Liked
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // Fullscreen Image Lightbox
  const [lightbox, setLightbox] = useState(null); // { src: string, title: string }

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['posts', 'media', 'friends', 'likes', 'saved'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // Collect all media photos from posts
  const allMediaImages = useMemo(() => {
    const list = [];
    posts.forEach((post) => {
      if (Array.isArray(post.image_urls) && post.image_urls.length > 0) {
        post.image_urls.forEach((url, idx) => {
          list.push({
            id: `${post.id}-${idx}`,
            postId: post.id,
            url,
            createdAt: post.createdAt || post.created_at,
          });
        });
      }
    });
    return list;
  }, [posts]);

  // Tab definitions
  const tabs = useMemo(() => {
    const list = [
      { key: 'posts', icon: FileText, label: 'Bài viết', count: posts.length },
      { key: 'media', icon: ImageIcon, label: 'Ảnh & Video', count: allMediaImages.length },
      { key: 'friends', icon: Users, label: 'Bạn bè', count: connections.length },
    ];
    if (isOwnProfile) {
      list.push(
        { key: 'likes', icon: Heart, label: 'Lượt thích' },
        { key: 'saved', icon: Bookmark, label: 'Đã lưu' }
      );
    }
    return list;
  }, [isOwnProfile, posts.length, allMediaImages.length, connections.length]);

  // Fetch profile user and their posts
  useEffect(() => {
    let isMounted = true;

    if (!validTargetUserId) {
      if (!currentUser) navigate('/login');
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [userRes, postsRes] = await Promise.all([
          userApi.getProfile(validTargetUserId),
          postApi.getByUserId(validTargetUserId),
        ]);

        const rawUser = userRes.data?.data || userRes.data;
        const rawPosts = Array.isArray(postsRes.data?.data || postsRes.data)
          ? postsRes.data?.data || postsRes.data
          : [];

        if (isMounted) {
          setUser({
            id: rawUser.id,
            email: rawUser.email,
            full_name: rawUser.full_name || rawUser.name,
            username: rawUser.username,
            avatar: rawUser.avatar || rawUser.profile_picture,
            background: rawUser.background || rawUser.cover_photo,
            bio: rawUser.bio,
            address: rawUser.address || rawUser.location,
            gender: rawUser.gender,
            date_of_birth: rawUser.date_of_birth,
            created_at: rawUser.created_at,
            profile_visibility: rawUser.profile_visibility || 'public',
            allow_friend_requests: rawUser.allow_friend_requests,
            is_locked: rawUser.is_locked,
            is_private: rawUser.is_private,
            is_friend_only: rawUser.is_friend_only,
          });
          setPosts(rawPosts);
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
        if (err.response?.status === 404 && isMounted) {
          navigate('/not-found');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [validTargetUserId, currentUser, navigate]);

  // Fetch friends connections
  useEffect(() => {
    let isMounted = true;
    if (!validTargetUserId) return;

    userApi
      .getConnections(validTargetUserId)
      .then((res) => {
        if (!isMounted) return;
        const conns = res.data?.connections || [];
        setConnections(Array.isArray(conns) ? conns : []);
      })
      .catch((err) => console.error('Fetch connections error:', err));

    return () => {
      isMounted = false;
    };
  }, [validTargetUserId]);

  // Load saved / liked posts when their tabs become active
  useEffect(() => {
    if (!isOwnProfile) return;

    if (activeTab === 'saved' && savedPosts.length === 0) {
      setLoadingTab(true);
      postApi
        .getSavedPosts()
        .then((res) => {
          const list = res.data?.data || res.data?.posts || res.data || [];
          setSavedPosts(Array.isArray(list) ? list : []);
        })
        .catch((err) => console.error('Fetch saved posts error:', err))
        .finally(() => setLoadingTab(false));
    }

    if (activeTab === 'likes' && likedPosts.length === 0) {
      setLoadingTab(true);
      postApi
        .getLikedPosts()
        .then((res) => {
          const list = res.data?.posts || res.data?.data || res.data || [];
          const uniquePosts = Array.from(
            new Map((Array.isArray(list) ? list : []).map((p) => [p.id, p])).values()
          );
          setLikedPosts(uniquePosts);
        })
        .catch((err) => console.error('Fetch liked posts error:', err))
        .finally(() => setLoadingTab(false));
    }
  }, [activeTab, isOwnProfile, savedPosts.length, likedPosts.length]);

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-slate-50/60 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl h-72 animate-pulse border border-slate-100 shadow-sm" />
          <PostSkeleton />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const coverUrl = user.background;
  const filteredFriends = connections.filter((f) =>
    (f.full_name || f.username || '')
      .toLowerCase()
      .includes(friendSearch.toLowerCase().trim())
  );

  return (
    <div className="relative h-full overflow-y-auto bg-slate-50/60 pb-16">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4">
        {/* PROFILE HEADER CARD */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          {/* COVER PHOTO BANNER */}
          <div
            onClick={
              coverUrl
                ? () =>
                    setLightbox({
                      src: coverUrl,
                      title: `Ảnh bìa của ${user.full_name || user.username}`,
                    })
                : undefined
            }
            className={`h-48 sm:h-64 md:h-80 w-full relative group bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden ${
              coverUrl ? 'cursor-pointer' : ''
            }`}
            title={coverUrl ? 'Nhấn để xem ảnh bìa' : undefined}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Ảnh bìa"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-800 text-white/50 text-sm font-medium">
                <span>Chưa có ảnh bìa</span>
              </div>
            )}

            {/* Gradient Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />

            {/* Change Cover Photo Button (Own Profile) */}
            {isOwnProfile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEdit(true);
                }}
                className="absolute bottom-4 right-4 px-4 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 backdrop-blur-md text-xs font-semibold flex items-center gap-2 transition active:scale-95 shadow-lg cursor-pointer z-10"
                title="Thay đổi ảnh bìa"
              >
                <Camera className="w-4 h-4 text-slate-700" />
                <span className="max-xs:hidden">Chỉnh sửa ảnh bìa</span>
              </button>
            )}
          </div>

          {/* USER INFO & HEADER STATS */}
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
            onViewAvatar={(url) =>
              setLightbox({
                src: url,
                title: `Ảnh đại diện của ${user.full_name || user.username}`,
              })
            }
            onTabChange={handleTabChange}
            activeTab={activeTab}
            mediaCount={allMediaImages.length}
          />
        </div>

        {/* LOCKED ACCOUNT NOTICE */}
        {user.is_locked && !isOwnProfile ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-xl mx-auto my-8">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {user.is_private ? 'Tài khoản này là riêng tư' : 'Tài khoản ở chế độ bạn bè'}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {user.is_private
                ? 'Chủ tài khoản đã cài đặt chế độ riêng tư cho hồ sơ cá nhân.'
                : 'Chỉ bạn bè mới có thể xem thông tin chi tiết và bài viết của người này.'}
            </p>
          </div>
        ) : (
          /* MAIN TWO-COLUMN SOCIAL LAYOUT */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: INTRO & WIDGETS (COL 4) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              {/* CARD: GIỚI THIỆU (ABOUT ME) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Giới thiệu</span>
                  </h3>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setShowEdit(true)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>

                {/* Bio Quote */}
                {user.bio ? (
                  <p className="text-sm text-slate-700 leading-relaxed font-normal italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80">
                    "{user.bio}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">Chưa có tiểu sử giới thiệu.</p>
                )}

                {/* Attributes list */}
                <div className="space-y-3 pt-1 text-xs sm:text-sm text-slate-600">
                  {user.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>
                        Sống tại <span className="font-semibold text-slate-900">{user.address}</span>
                      </span>
                    </div>
                  )}

                  {user.date_of_birth && (
                    <div className="flex items-center gap-3">
                      <Cake className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>
                        Ngày sinh:{' '}
                        <span className="font-semibold text-slate-900">
                          {dayjs(user.date_of_birth).format('DD/MM/YYYY')}
                        </span>
                      </span>
                    </div>
                  )}

                  {user.gender && GENDER_LABELS[user.gender] && (
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 flex items-center justify-center font-bold text-slate-400 text-xs">
                        ⚧
                      </span>
                      <span>
                        Giới tính:{' '}
                        <span className="font-semibold text-slate-900">
                          {GENDER_LABELS[user.gender]}
                        </span>
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>
                      Tham gia vào{' '}
                      <span className="font-semibold text-slate-900">
                        {user.created_at ? dayjs(user.created_at).format('MMMM, YYYY') : 'gần đây'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>
                      Hồ sơ:{' '}
                      <span className="font-semibold text-slate-900 capitalize">
                        {user.profile_visibility === 'private'
                          ? 'Riêng tư'
                          : user.profile_visibility === 'friends'
                          ? 'Chỉ bạn bè'
                          : 'Công khai'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD: ẢNH GẦN ĐÂY (PHOTOS WIDGET) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">Ảnh</h3>
                    <span className="text-xs text-slate-400 font-medium">
                      ({allMediaImages.length})
                    </span>
                  </div>
                  {allMediaImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTabChange('media')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Xem tất cả
                    </button>
                  )}
                </div>

                {allMediaImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {allMediaImages.slice(0, 9).map((img) => (
                      <div
                        key={img.id}
                        onClick={() =>
                          setLightbox({
                            src: img.url,
                            title: `Ảnh đăng bởi ${user.full_name || user.username}`,
                          })
                        }
                        className="aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer group relative shadow-xs"
                      >
                        <img
                          src={img.url}
                          alt="media"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Chưa có ảnh nào được đăng.</p>
                )}
              </div>

              {/* CARD: BẠN BÈ (FRIENDS WIDGET) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">Bạn bè</h3>
                    <span className="text-xs text-slate-400 font-medium">
                      ({connections.length})
                    </span>
                  </div>
                  {connections.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTabChange('friends')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Xem tất cả
                    </button>
                  )}
                </div>

                {connections.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {connections.slice(0, 6).map((friend) => (
                      <Link
                        key={friend.id}
                        to={`/profile/${friend.id}`}
                        className="group flex flex-col items-center text-center"
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 mb-1.5 shadow-xs transition group-hover:scale-105 group-hover:border-indigo-400">
                          <img
                            src={friend.avatar || '/default.jpg'}
                            alt={friend.full_name || friend.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-800 line-clamp-1 group-hover:text-indigo-600">
                          {friend.full_name || friend.username}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Chưa có bạn bè nào.</p>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: MAIN TABS & FEED CONTENT (COL 8) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* MODERN TAB NAVIGATION BAR */}
              <div className="bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm flex items-center gap-1 overflow-x-auto">
                {tabs.map(({ key, icon: Icon, label, count }) => {
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTabChange(key)}
                      className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{label}</span>
                      {typeof count === 'number' && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: POSTS FEED */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={`post-${post.id}`}
                      post={post}
                      currentUser={currentUser}
                      onPostDeleted={(postId) => {
                        setPosts((prev) => prev.filter((p) => p.id !== postId));
                      }}
                      onPostUpdated={(updated) => {
                        setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
                      }}
                    />
                  ))}

                  {posts.length === 0 && (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-500">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-1">
                        Chưa có bài viết nào
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {isOwnProfile
                          ? 'Hãy chia sẻ cảm nghĩ, hình ảnh đầu tiên của bạn lên dòng thời gian!'
                          : 'Người dùng này chưa đăng bài viết nào.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MEDIA GALLERY */}
              {activeTab === 'media' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-base text-slate-900">Tất cả ảnh & video</h3>
                    <span className="text-xs text-slate-400 font-medium">
                      Tổng số: {allMediaImages.length}
                    </span>
                  </div>

                  {allMediaImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {allMediaImages.map((media) => (
                        <div
                          key={media.id}
                          onClick={() =>
                            setLightbox({
                              src: media.url,
                              title: `Ảnh đăng bởi ${user.full_name || user.username}`,
                            })
                          }
                          className="group aspect-square rounded-2xl overflow-hidden bg-slate-100 relative cursor-pointer shadow-xs border border-slate-100"
                        >
                          <img
                            src={media.url}
                            alt="Media"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-white">
                            <div className="self-end p-1.5 rounded-full bg-black/40 backdrop-blur-xs">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-medium">
                              {dayjs(media.createdAt).fromNow()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-pink-500">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-1">
                        Chưa có ảnh & video nào
                      </h4>
                      <p className="text-xs text-slate-400">
                        Các bài đăng chứa hình ảnh sẽ hiển thị tại đây.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FRIENDS LIST */}
              {activeTab === 'friends' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">
                        Danh sách bạn bè ({connections.length})
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Những người bạn đã kết nối trên HVTSocial
                      </p>
                    </div>

                    {/* Search Friends Filter */}
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        placeholder="Tìm kiếm bạn bè..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>
                  </div>

                  {filteredFriends.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredFriends.map((f) => (
                        <div
                          key={f.id}
                          className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-xs transition bg-slate-50/50 flex items-center justify-between gap-3"
                        >
                          <Link
                            to={`/profile/${f.id}`}
                            className="flex items-center gap-3 min-w-0 flex-1 group"
                          >
                            <img
                              src={f.avatar || '/default.jpg'}
                              alt={f.full_name || f.username}
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition">
                                {f.full_name || f.username}
                              </h4>
                              <p className="text-xs text-slate-400 truncate">
                                {f.username ? `@${f.username}` : ''}
                              </p>
                            </div>
                          </Link>

                          <Link
                            to={`/profile/${f.id}`}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                          >
                            <span>Xem</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-500">
                        <Users className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-1">
                        {friendSearch ? 'Không tìm thấy bạn bè phù hợp' : 'Chưa có bạn bè nào'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {friendSearch
                          ? 'Thử tìm kiếm với từ khóa khác'
                          : 'Hãy kết nối thêm nhiều bạn bè để cập nhật tin tức mới!'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LIKES */}
              {activeTab === 'likes' && isOwnProfile && (
                <div className="space-y-4">
                  {loadingTab ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                  ) : likedPosts.length > 0 ? (
                    likedPosts.map((post, index) => (
                      <div key={`liked-${post.id}-${index}`}>
                        <PostCard
                          post={post}
                          currentUser={currentUser}
                          onPostDeleted={(postId) =>
                            setLikedPosts((prev) => prev.filter((p) => p.id !== postId))
                          }
                          onPostUnliked={(postId) =>
                            setLikedPosts((prev) => prev.filter((p) => p.id !== postId))
                          }
                        />
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-red-500">
                        <Heart className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-1">
                        Chưa có bài viết nào được thích
                      </h4>
                      <p className="text-xs text-slate-400">
                        Nhấn vào icon trái tim ở các bài viết bạn yêu thích để xem lại tại đây.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: SAVED */}
              {activeTab === 'saved' && isOwnProfile && (
                <div className="space-y-4">
                  {loadingTab ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                  ) : savedPosts.length > 0 ? (
                    savedPosts.map((post) => (
                      <PostCard
                        key={`saved-post-${post.id}`}
                        post={post}
                        currentUser={currentUser}
                        onPostDeleted={(postId) =>
                          setSavedPosts((prev) => prev.filter((p) => p.id !== postId))
                        }
                        onPostUnsaved={(postId) =>
                          setSavedPosts((prev) => prev.filter((p) => p.id !== postId))
                        }
                      />
                    ))
                  ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-500">
                        <Bookmark className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-1">
                        Chưa có bài viết nào được lưu
                      </h4>
                      <p className="text-xs text-slate-400">
                        Lưu những bài viết hữu ích để dễ dàng xem lại bất cứ lúc nào.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEdit && (
        <ProfileModal
          user={user}
          setUser={setUser}
          setShowEdit={setShowEdit}
        />
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX (AVATAR, COVER, OR POST MEDIA) */}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
};

export default Profile;
