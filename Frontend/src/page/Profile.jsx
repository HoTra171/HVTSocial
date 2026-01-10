import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Heart, FileText, Image, Bookmark } from "lucide-react";
import UserProfileInfo from "../components/UserProfileInfo";
import Loading from "../components/Loading";
import PostCard from "../components/PostCard";
import ProfileModal from "../components/ProfileModal";
import "dayjs/locale/vi";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { API_URL, SERVER_ORIGIN } from '../constants/api';

dayjs.extend(relativeTime);
dayjs.extend(utc);



const Profile = () => {
  // /profile/:profileId => xem người khác, /profile => self
  const { profileId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);

  const tabs = [
    { key: "posts", icon: FileText, label: "Bài viết" },
    { key: "media", icon: Image, label: "Ảnh & video" },
    { key: "likes", icon: Heart, label: "Lượt thích" },
    { key: "saved", icon: Bookmark, label: "Đã lưu" }
  ];


  useEffect(() => {
    const fetchUserAndPosts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        // Lấy id user hiện tại từ localStorage.user (đã lưu khi login / signup)
        let selfId = null;
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            selfId = parsed.id; // backend login trả user.id
          } catch (e) {
            console.error("Parse user from localStorage error:", e);
          }
        }

        // Nếu đang xem người khác: dùng profileId, nếu không: dùng selfId
        const idToFetch = profileId || selfId;
        if (!idToFetch) {
          console.error("No profileId or current user id");
          navigate("/");
          return;
        }

        // Gọi song song thông tin user + các bài post của user đó
        const [userRes, postsRes] = await Promise.all([
          axios.get(`${API_URL}/users/${idToFetch}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),

          axios.get(`${API_URL}/posts/user/${idToFetch}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const rawUser = userRes.data;
        const rawPosts = Array.isArray(postsRes.data) ? postsRes.data : [];

        // Map user về dạng FE dùng
        const mappedUser = {
          id: rawUser.id,
          email: rawUser.email,
          full_name: rawUser.full_name,
          username: rawUser.username,
          avatar: rawUser.avatar,
          background: rawUser.background,
          bio: rawUser.bio,
          address: rawUser.address,
          created_at: rawUser.created_at,
          followers: rawUser.followers || [],
          following: rawUser.following || [],
        };

        setUser(mappedUser);

        setPosts(rawPosts);
      } catch (err) {
        console.error("Fetch profile error:", err);
        if (err.response?.status === 404) {
          navigate("/not-found");
        }
      }
    };

    fetchUserAndPosts();
  }, [profileId, navigate]);


  const fetchSavedPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_URL}/saved-posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSavedPosts(res.data || []);
    } catch (err) {
      console.error("Fetch saved posts error:", err);
    }
  };

  // THÊM HÀM NÀY
  const fetchLikedPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_URL}/likes/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Loại bỏ các bài post trùng lặp dựa trên ID
      const uniquePosts = Array.from(
        new Map((res.data || []).map(post => [post.id, post])).values()
      );

      setLikedPosts(uniquePosts);
    } catch (err) {
      console.error("Fetch liked posts error:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "saved" && !profileId) {
      // Chỉ load saved posts khi xem profile của chính mình
      fetchSavedPosts();
    }

    if (activeTab === "likes" && !profileId) {
      fetchLikedPosts();
    }
  }, [activeTab, profileId]);
  if (!user) return <Loading />;



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
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 opacity-90"></div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* USER INFO */}
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId} // nếu không có profileId => đang xem chính mình -> hiện nút Edit
            setShowEdit={setShowEdit}
          />

          {/* TABS */}
          <div className="px-6 pt-6">
            <div className="bg-gray-50 rounded-2xl p-1.5 flex max-w-2xl mx-auto shadow-inner border border-gray-200">
              {tabs.map(({ key, icon: Icon, label }) => (
                <button
                  key={`tab-${key}`}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 px-3 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 relative ${
                    activeTab === key
                      ? "bg-white text-indigo-600 shadow-md scale-105"
                      : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  }`}
                  title={label}
                >
                  <Icon className={`w-5 h-5 ${activeTab === key ? "animate-pulse" : ""}`} />
                  <span className="max-sm:hidden">{label}</span>
                  {activeTab === key && (
                    <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* POSTS TAB */}
          {activeTab === "posts" && (
            <div className="mt-8 px-4 pb-6 flex flex-col items-center gap-6">
              {posts.map((post) => (
                <PostCard
                  key={`post-${post.id}`}
                  post={post}
                  currentUser={user}
                  onPostDeleted={(postId) => {
                    setPosts(posts.filter(p => p.id !== postId));
                  }}
                />
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

          {/* MEDIA TAB */}
          {activeTab === "media" && (
            <div className="mt-8 px-4 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
                {posts
                  .filter((post) => post.image_urls?.length > 0)
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
                            {dayjs(post.createdAt).fromNow()}
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

          {/* LIKES TAB */}
          {activeTab === "likes" && (
            <div className="mt-8 px-4 pb-6">
              {profileId ? (
                // Nếu đang xem profile người khác
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-red-500" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Nội dung riêng tư</p>
                  <p className="text-gray-400 text-sm">Không thể xem bài viết đã thích của người khác</p>
                </div>
              ) : (
                // Nếu đang xem profile của chính mình
                <div className="flex flex-col items-center gap-6">
                  {likedPosts.map((post, index) => (
                    <div key={`liked-${post.id}-${index}`} className="w-full max-w-2xl">
                      {/* Hiển thị thời gian thích */}
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
                        currentUser={user}
                        onPostDeleted={(postId) => {
                          setLikedPosts(likedPosts.filter(p => p.id !== postId));
                        }}
                        onPostUnliked={(postId) => {
                          setLikedPosts(likedPosts.filter(p => p.id !== postId));
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

          {/* SAVED TAB */}
          {activeTab === "saved" && (
            <div className="mt-8 px-4 pb-6">
              {profileId ? (
                // Nếu đang xem profile người khác
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Bookmark className="w-10 h-10 text-amber-500" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Nội dung riêng tư</p>
                  <p className="text-gray-400 text-sm">Không thể xem bài viết đã lưu của người khác</p>
                </div>
              ) : (
                // Nếu đang xem profile của chính mình
                <div className="flex flex-col items-center gap-6">
                  {savedPosts.map((post) => (
                    <PostCard
                      key={`saved-post-${post.id}`}
                      post={post}
                      currentUser={user}
                      onPostDeleted={(postId) => {
                        setSavedPosts(savedPosts.filter(p => p.id !== postId));
                      }}
                      onPostUnsaved={(postId) => {
                        setSavedPosts(savedPosts.filter(p => p.id !== postId));
                      }}
                    />
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
