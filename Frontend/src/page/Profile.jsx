import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { Heart } from "lucide-react";
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
          axios.get(`${API_BASE_URL}/users/${idToFetch}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),

          axios.get(`${API_BASE_URL}/posts/user/${idToFetch}`, {
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

      const res = await axios.get(`${API_BASE_URL}/saved-posts`, {
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

      const res = await axios.get(`${API_BASE_URL}/likes/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLikedPosts(res.data || []);
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
    <div className="relative h-full overflow-y-scroll bg-gray-50 p-6 sm:-ml-60">
      <div className="max-w-3xl mx-auto">
        {/* PROFILE CARD */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {/* COVER PHOTO */}
          <div className="h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
            {user.background && (
              <img
                src={user.background}
                alt="cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* USER INFO */}
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId} // nếu không có profileId => đang xem chính mình -> hiện nút Edit
            setShowEdit={setShowEdit}
          />

          {/* TABS */}
          <div className="mt-6">
            <div className="bg-white rounded-xl shadow p-1 flex max-w-md mx-auto">
              {["posts", "media", "likes", "saved"].map((tab) => (
                <button
                  key={`tab-${tab}`}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* POSTS TAB */}
          {activeTab === "posts" && (
            <div className="mt-6 flex flex-col items-center gap-6">
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
                <p className="mb-6 text-gray-500 text-sm">
                  Chưa có bài viết nào.
                </p>
              )}
            </div>
          )}

          {/* MEDIA TAB */}
          {activeTab === "media" && (
            <div className="flex flex-wrap mt-6 max-w-6xl">
              {posts
                .filter((post) => post.image_urls?.length > 0)
                .map((post) => (
                  <div key={post.id}>
                    {post.image_urls.map((image, index) => (
                      <Link
                        key={`image-${index}`}
                        to={image}
                        target="_blank"
                        className="relative group"
                      >
                        <img
                          src={image}
                          alt=""
                          className="w-64 aspect-video object-cover"
                        />
                        <p className="absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300">
                          Posted {dayjs(post.createdAt).fromNow()}
                        </p>
                      </Link>
                    ))}
                  </div>
                ))}

              {posts.filter((p) => p.image_urls?.length > 0).length === 0 && (
                <p className="m-6 text-gray-500 text-sm w-full text-center">
                  Chưa có ảnh nào được đăng.
                </p>
              )}

            </div>
          )} 

          {/* LIKES TAB */}
          {activeTab === "likes" && (
            <div className="mt-6 mb-6">
              {profileId ? (
                // Nếu đang xem profile người khác
                <div className="text-center text-gray-500">
                  Không thể xem bài viết đã thích của người khác.
                </div>
              ) : (
                // Nếu đang xem profile của chính mình
                <div className="flex flex-col items-center gap-6">
                  {likedPosts.map((post) => (
                    <div key={`liked-post-${post.id}`} className="w-full max-w-2xl">
                      {/* Hiển thị thời gian thích */}
                      {post.likedAt && (
                        <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                          <span>
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
                    <div className="text-center py-8">
                      <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">
                        Chưa có bài viết nào được thích
                      </p>
                      <p className="text-gray-400 text-sm">
                        Nhấn vào icon trái tim trên bài viết để thích
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* THÊM SAVED TAB */}
          {activeTab === "saved" && (
            <div className="mt-6 mb-6">
              {profileId ? (
                // Nếu đang xem profile người khác
                <div className="text-center text-gray-500">
                  Không thể xem bài viết đã lưu của người khác.
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
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-2">
                        Chưa có bài viết nào được lưu
                      </p>
                      <p className="text-gray-400 text-sm">
                        Nhấn vào icon bookmark trên bài viết để lưu lại
                      </p>
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
