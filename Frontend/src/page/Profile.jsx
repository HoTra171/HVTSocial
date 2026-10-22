import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/vi';
import { Heart, FileText, Image, Bookmark, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../api/userApi';
import { postApi } from '../api/postApi';
import UserProfileInfo from '../components/UserProfileInfo';
import PostCard from '../components/post/PostCard';
import ProfileModal from '../components/ProfileModal';
import { PostSkeleton } from '../components/common/SkeletonLoader';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.locale('vi');

const Profile = () => {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const validTargetUserId = (profileId && profileId !== 'undefined' && !isNaN(Number(profileId)))
    ? Number(profileId)
    : (currentUser?.id || null);
  const isOwnProfile = !profileId || Number(currentUser?.id) === Number(validTargetUserId);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEdit, setShowEdit] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['posts', 'media', 'likes', 'saved'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs = useMemo(() => {
    const list = [
      { key: 'posts', icon: FileText, label: 'Bài viết' },
      { key: 'media', icon: Image, label: 'Ảnh & video' },
    ];
    if (isOwnProfile) {
      list.push(
        { key: 'likes', icon: Heart, label: 'Lượt thích' },
        { key: 'saved', icon: Bookmark, label: 'Đã lưu' }
      );
    }
    return list;
  }, [isOwnProfile]);

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
            background: rawUser.background,
            bio: rawUser.bio,
            address: rawUser.address,
            created_at: rawUser.created_at,
            followers: rawUser.followers || [],
            following: rawUser.following || [],
            profile_visibility: rawUser.profile_visibility,
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
  }, [targetUserId, currentUser, navigate]);

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
      <div className="h-full overflow-y-scroll bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl h-64 animate-pulse border border-gray-100" />
          <PostSkeleton />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative h-full overflow-y-scroll bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* PROFILE CARD */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {/* COVER PHOTO */}
          <div className="h-48 md:h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative group">
            {user.background ? (
              <img
                src={user.background}
                alt="cover"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 opacity-90" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* USER INFO */}
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />

          {/* PROFILE LOCKED STATE */}
          {user.is_locked && !isOwnProfile ? (
            <div className="py-20 px-6 text-center border-t border-gray-100 mt-6 bg-gradient-to-b from-gray-50/50 to-white">
              <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {user.is_private ? 'Tài khoản này là riêng tư' : 'Tài khoản ở chế độ chỉ bạn bè'}
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                {user.is_private
                  ? 'Chủ tài khoản đã cài đặt chế độ riêng tư cho hồ sơ cá nhân.'
                  : 'Chỉ bạn bè mới có thể xem thông tin chi tiết và bài viết của người này.'}
              </p>
            </div>
          ) : (
            <>
              {/* TABS */}
              <div className="px-6 pt-6">
                <div className="bg-gray-50 rounded-2xl p-1.5 flex max-w-2xl mx-auto shadow-inner border border-gray-200">
                  {tabs.map(({ key, icon: Icon, label }) => (
                    <button
                      key={`tab-${key}`}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 relative ${
                        activeTab === key
                          ? 'bg-white text-indigo-600 shadow-md scale-105'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                      }`}
                      title={label}
                    >
                      <Icon className={`w-5 h-5 ${activeTab === key ? 'animate-pulse' : ''}`} />
                      <span className="max-sm:hidden">{label}</span>
                      {activeTab === key && (
                        <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1: POSTS */}
              {activeTab === 'posts' && (
                <div className="mt-8 px-4 pb-6 flex flex-col items-center gap-6">
              {posts.map((post) => (
                <div key={`post-${post.id}`} className="w-full max-w-2xl">
                  <PostCard
                    post={post}
                    currentUser={currentUser}
                    onPostDeleted={(postId) => {
                      setPosts((prev) => prev.filter((p) => p.id !== postId));
                    }}
                  />
                </div>
              ))}

              {posts.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-indigo-500" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Chưa có bài viết nào</p>
                  <p className="text-gray-400 text-sm">Bài viết sẽ hiển thị ở đây</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEDIA */}
          {activeTab === 'media' && (
            <div className="mt-8 px-4 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                {posts
                  .filter((p) => p.image_urls?.length > 0)
                  .flatMap((post) =>
                    post.image_urls.map((image, index) => (
                      <Link
                        key={`${post.id}-${index}`}
                        to={image}
                        target="_blank"
                        className="relative group aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
                      >
                        <img
                          src={image}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="absolute bottom-3 left-3 text-xs font-medium text-white">
                            {dayjs(post.createdAt || post.created_at).fromNow()}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
              </div>

              {posts.filter((p) => p.image_urls?.length > 0).length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Image className="w-10 h-10 text-pink-500" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Chưa có ảnh & video</p>
                  <p className="text-gray-400 text-sm">Ảnh và video sẽ hiển thị ở đây</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIKES */}
          {activeTab === 'likes' && (
            <div className="mt-8 px-4 pb-6">
              {!isOwnProfile ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-red-500" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Nội dung riêng tư</p>
                  <p className="text-gray-400 text-sm">
                    Không thể xem bài viết đã thích của người khác
                  </p>
                </div>
              ) : loadingTab ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  {likedPosts.map((post, index) => (
                    <div key={`liked-${post.id}-${index}`} className="w-full max-w-2xl">
                      {post.likedAt && (
                        <div className="text-xs text-slate-500 mb-2 flex items-center gap-2 px-2">
                          <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                          <span className="font-medium">
                            Đã thích {new Date(post.likedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}

                      <PostCard
                        post={post}
                        currentUser={currentUser}
                        onPostDeleted={(postId) => {
                          setLikedPosts((prev) => prev.filter((p) => p.id !== postId));
                        }}
                        onPostUnliked={(postId) => {
                          setLikedPosts((prev) => prev.filter((p) => p.id !== postId));
                        }}
                      />
                    </div>
                  ))}

                  {likedPosts.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Heart className="w-10 h-10 text-red-500" />
                      </div>
                      <p className="text-gray-600 font-medium mb-2">Chưa có bài viết nào được thích</p>
                      <p className="text-gray-400 text-sm">Nhấn vào icon trái tim để thích bài viết</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SAVED */}
          {activeTab === 'saved' && (
            <div className="mt-8 px-4 pb-6">
              {!isOwnProfile ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Bookmark className="w-10 h-10 text-amber-500" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Nội dung riêng tư</p>
                  <p className="text-gray-400 text-sm">
                    Không thể xem bài viết đã lưu của người khác
                  </p>
                </div>
              ) : loadingTab ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  {savedPosts.map((post) => (
                    <div key={`saved-post-${post.id}`} className="w-full max-w-2xl">
                      <PostCard
                        post={post}
                        currentUser={currentUser}
                        onPostDeleted={(postId) => {
                          setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
                        }}
                        onPostUnsaved={(postId) => {
                          setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
                        }}
                      />
                    </div>
                  ))}

                  {savedPosts.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Bookmark className="w-10 h-10 text-amber-500" />
                      </div>
                      <p className="text-gray-600 font-medium mb-2">Chưa có bài viết nào được lưu</p>
                      <p className="text-gray-400 text-sm">Nhấn vào icon bookmark để lưu bài viết</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEdit && (
        <ProfileModal
          user={user}
          setUser={setUser}
          setShowEdit={setShowEdit}
        />
      )}
    </div>
  );
};

export default Profile;
