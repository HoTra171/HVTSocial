import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Users,
  X,
  Clock,
  Sparkles,
  FileText,
  Compass,
  Heart,
  MessageCircle,
  Copy,
  Layers,
  Flame,
  Camera,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { userApi, postApi } from '../api';
import { useAuth } from '../contexts';
import PostCard from '../components/PostCard';
import FriendButton from '../components/FriendButton';
import InstagramPostModal from '../components/post/InstagramPostModal';

const EXPLORE_TABS = [
  { key: 'explore', label: 'Khám phá', icon: Compass },
  { key: 'accounts', label: 'Tài khoản', icon: Users },
  { key: 'media', label: 'Ảnh & Video', icon: Camera },
  { key: 'feed', label: 'Bài viết', icon: FileText },
];

const Discover = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'accounts' | 'media' | 'feed'
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search History
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // Selected post for Instagram Detail Modal
  const [selectedPost, setSelectedPost] = useState(null);

  // Sync with tab url param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['explore', 'accounts', 'media', 'feed'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('searchHistory');
      if (stored) setSearchHistory(JSON.parse(stored));
    } catch (e) {
      console.error('Parse search history error:', e);
    }
  }, []);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch explore feed (all posts) and suggestions
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      postApi.getFeed({ limit: 40 }).catch(() => ({ data: { posts: [] } })),
      userApi.getSuggestions().catch(() => ({ data: { data: [] } })),
      userApi.discover({ limit: 40 }).catch(() => ({ data: { data: [] } })),
    ])
      .then(([feedRes, sugRes, usersRes]) => {
        if (!isMounted) return;
        const feedPosts = feedRes.data?.posts || feedRes.data?.data || [];
        const sugUsers = sugRes.data?.data || [];
        const allUsers = usersRes.data?.data || [];

        setPosts(Array.isArray(feedPosts) ? feedPosts : []);
        setSuggestions(Array.isArray(sugUsers) ? sugUsers : []);
        setUsers(Array.isArray(allUsers) ? allUsers : []);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Perform search
  const performSearch = async (keyword = '') => {
    const trimmed = keyword.trim();
    setHasSearched(trimmed !== '');
    setLoading(true);

    try {
      if (trimmed === '') {
        // Reset to default feed
        const [feedRes, usersRes] = await Promise.all([
          postApi.getFeed({ limit: 40 }),
          userApi.discover({ limit: 40 }),
        ]);
        setPosts(feedRes.data?.posts || feedRes.data?.data || []);
        setUsers(usersRes.data?.data || []);
      } else {
        const [usersRes, postsRes] = await Promise.all([
          userApi.discover({ search: trimmed }),
          postApi.search({ q: trimmed }),
        ]);

        setUsers(usersRes.data?.data || []);
        setPosts(postsRes.data?.posts || postsRes.data?.data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced input change
  const handleInputChange = (value) => {
    setInput(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 400);
  };

  // Save to history
  const saveToHistory = (keyword) => {
    if (!keyword || !keyword.trim()) return;
    const trimmed = keyword.trim();
    const updated = [trimmed, ...searchHistory.filter((item) => item !== trimmed)].slice(0, 8);
    setSearchHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      const keyword = input.trim();
      if (keyword) {
        saveToHistory(keyword);
        performSearch(keyword);
        setShowHistory(false);
      }
    }
  };

  const handleHistoryClick = (keyword) => {
    setInput(keyword);
    saveToHistory(keyword);
    performSearch(keyword);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // Filter posts that have photos (for Instagram visual grid)
  const visualPosts = useMemo(() => {
    return posts.filter(
      (p) => Array.isArray(p.image_urls) && p.image_urls.length > 0 && p.image_urls[0]
    );
  }, [posts]);

  return (
    <div className="min-h-screen bg-white md:bg-slate-50/40 pb-20">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 md:px-6 pt-4 sm:pt-6">
        {/* INSTAGRAM-STYLE SEARCH & HEADER BAR */}
        <div className="mb-4">
          <div className="relative max-w-xl mx-auto" ref={searchRef}>
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleSearchSubmit}
                onFocus={() => setShowHistory(true)}
                placeholder="Tìm kiếm người dùng, bài viết, ảnh..."
                className="w-full pl-11 pr-10 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-100/80 focus:bg-white rounded-2xl text-xs sm:text-sm font-medium border border-transparent focus:border-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-100 transition shadow-xs text-slate-900 placeholder:text-slate-400"
              />
              {input && (
                <button
                  type="button"
                  onClick={() => {
                    setInput('');
                    performSearch('');
                  }}
                  className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search History Dropdown */}
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-30 p-2 overflow-hidden animate-in fade-in">
                <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400">
                  <span>GẦN ĐÂY</span>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                </div>
                <div className="space-y-0.5">
                  {searchHistory.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleHistoryClick(item)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs sm:text-sm font-medium text-slate-700 transition"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = searchHistory.filter((x) => x !== item);
                          setSearchHistory(next);
                          localStorage.setItem('searchHistory', JSON.stringify(next));
                        }}
                        className="p-1 text-slate-300 hover:text-slate-600 rounded-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* INSTAGRAM SUGGESTED USERS RAIL (STORY-LIKE CAROUSEL) */}
        {!hasSearched && suggestions.length > 0 && (
          <div className="mb-6 bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Gợi ý cho bạn
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('accounts');
                  setSearchParams({ tab: 'accounts' });
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Horizontal Scroll of Story-style Avatars */}
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none px-1">
              {suggestions.slice(0, 12).map((user) => {
                const uId = user._id || user.id;
                const avatar = user.avatar || user.profile_picture || '/default.jpg';
                return (
                  <Link
                    key={`story-${uId}`}
                    to={`/profile/${uId}`}
                    className="flex flex-col items-center flex-shrink-0 group w-16 sm:w-20 text-center"
                  >
                    {/* Rainbow Story Ring */}
                    <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform duration-300 shadow-xs">
                      <div className="p-0.5 rounded-full bg-white">
                        <img
                          src={avatar}
                          alt={user.full_name}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 truncate w-full mt-1.5 group-hover:text-indigo-600">
                      {user.username || user.full_name}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate w-full">Gợi ý</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* INSTAGRAM EXPLORE TABS (PILLS) */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {EXPLORE_TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveTab(key);
                  setSearchParams({ tab: key });
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: KHÁM PHÁ (THE SIGNATURE INSTAGRAM 3-COLUMN MOSAIC GRID) */}
        {/* ============================================================== */}
        {activeTab === 'explore' && (
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-slate-200 animate-pulse rounded-lg sm:rounded-2xl"
                  />
                ))}
              </div>
            ) : visualPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3">
                {visualPosts.map((post) => {
                  const hasMultiImages = post.image_urls && post.image_urls.length > 1;
                  const coverImage = post.image_urls[0];
                  const author = post.user || {};

                  return (
                    <div
                      key={`grid-${post.id}`}
                      onClick={() => setSelectedPost(post)}
                      className="group relative aspect-square bg-slate-100 overflow-hidden rounded-md sm:rounded-2xl cursor-pointer shadow-2xs select-none"
                    >
                      <img
                        src={coverImage}
                        alt="Explore Post"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Multi-Photo Badge in Top Right */}
                      {hasMultiImages && (
                        <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-xs text-white">
                          <Layers className="w-3.5 h-3.5 drop-shadow" />
                        </div>
                      )}

                      {/* Instagram Hover Overlay with Heart & Comments */}
                      <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 text-white">
                        <div className="self-start">
                          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-medium">
                            <img
                              src={author.avatar || author.profile_picture || '/default.jpg'}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="truncate max-w-[90px]">
                              @{author.username || author.full_name}
                            </span>
                          </div>
                        </div>

                        {/* Centered Likes & Comments count */}
                        <div className="flex items-center justify-center gap-4 sm:gap-6 font-bold text-xs sm:text-base">
                          <div className="flex items-center gap-1.5 drop-shadow">
                            <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
                            <span>{post.likes_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5 drop-shadow">
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
                            <span>{post.comments_count || 0}</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-white/80 line-clamp-1">
                          {post.content || ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Chưa có bài đăng hình ảnh
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Hãy chia sẻ hình ảnh hoặc bài viết đầu tiên để bắt đầu khám phá nội dung trên
                  HVTSocial!
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TÀI KHOẢN (INSTAGRAM ACCOUNTS LIST) */}
        {/* ============================================================== */}
        {activeTab === 'accounts' && (
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 bg-slate-100 animate-pulse rounded-2xl border border-slate-200/50"
                  />
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {users.map((u) => {
                  const uId = u._id || u.id;
                  const avatar = u.avatar || u.profile_picture || '/default.jpg';
                  const name = u.full_name || u.name || 'Người dùng';
                  const username = u.username ? `@${u.username}` : '';

                  return (
                    <div
                      key={`user-${uId}`}
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:border-slate-200 transition"
                    >
                      <Link to={`/profile/${uId}`} className="flex items-center gap-3.5 min-w-0 flex-1 group">
                        {/* Instagram Gradient Ring */}
                        <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex-shrink-0">
                          <img
                            src={avatar}
                            alt={name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 truncate transition">
                            {name}
                          </h4>
                          {username && (
                            <p className="text-xs text-slate-400 font-medium truncate">
                              {username}
                            </p>
                          )}
                          {u.bio && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {u.bio}
                            </p>
                          )}
                        </div>
                      </Link>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {currentUser?.id === uId ? (
                          <Link
                            to={`/profile/${uId}`}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                          >
                            Hồ sơ
                          </Link>
                        ) : (
                          <FriendButton
                            userId={uId}
                            currentUserId={currentUser?.id}
                            fullWidth={false}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">Không tìm thấy tài khoản nào</h3>
                <p className="text-xs text-slate-400 mt-1">Thử tìm kiếm với tên hoặc username khác</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: ẢNH & VIDEO (ONLY MEDIA GALLERY) */}
        {/* ============================================================== */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            {visualPosts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {visualPosts.flatMap((post) =>
                  post.image_urls.map((imgUrl, imgIdx) => (
                    <div
                      key={`media-${post.id}-${imgIdx}`}
                      onClick={() => setSelectedPost(post)}
                      className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 cursor-pointer shadow-2xs"
                    >
                      <img
                        src={imgUrl}
                        alt="Media"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-white" />
                          {post.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 fill-white" />
                          {post.comments_count || 0}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                <Camera className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">Chưa có ảnh & video nào</h3>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: BÀI VIẾT (FULL POST FEED) */}
        {/* ============================================================== */}
        {activeTab === 'feed' && (
          <div className="max-w-2xl mx-auto space-y-5">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-white rounded-3xl animate-pulse border border-slate-100"
                  />
                ))}
              </div>
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={`feed-${post.id}`}
                  post={post}
                  currentUser={currentUser}
                  onPostDeleted={(postId) =>
                    setPosts((prev) => prev.filter((p) => p.id !== postId))
                  }
                />
              ))
            ) : (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">Chưa có bài viết nào</h3>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INSTAGRAM POST DETAIL MODAL */}
      {selectedPost && (
        <InstagramPostModal
          post={selectedPost}
          currentUser={currentUser}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default Discover;
