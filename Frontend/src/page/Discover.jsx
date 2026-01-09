import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Users, X, Clock, Trash2, UserPlus, Sparkles } from 'lucide-react';
import UserCard from '../components/UserCard';
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';
import { API_URL, SERVER_ORIGIN } from '../constants/api';



const Discover = () => {
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, not-friends, friends
  const [searchType, setSearchType] = useState('user'); // user, post
  const [posts, setPosts] = useState([]); // Store search result posts
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // Load current user and search history
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Parse user error:', e);
      }
    }

    // Load search history from localStorage
    const storedHistory = localStorage.getItem('searchHistory');
    if (storedHistory) {
      try {
        setSearchHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error('Parse search history error:', e);
      }
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

  // Fetch users or posts
  const fetchUsers = async (keyword = '') => {
    try {
      setLoading(true);
      setHasSearched(keyword.trim() !== '');

      const token = localStorage.getItem('token');

      if (searchType === 'user') {
        const res = await axios.get(`${API_URL}/users/discover`, {
          params: { search: keyword, filterType },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) setUsers(res.data.data || []);
        else setUsers([]);
      } else {
        // Fetch Posts
        const res = await axios.get(`${API_URL}/posts/search`, {
          params: { q: keyword },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) setPosts(res.data.posts || []);
        else setPosts([]);
      }
    } catch (err) {
      console.error('Discover fetch error:', err);
      if (searchType === 'user') setUsers([]);
      else setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggestions for you
  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/users/suggestions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.success) {
        setSuggestions(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch suggestions error:', err);
    }
  };

  // Load lần đầu
  useEffect(() => {
    fetchUsers();
    fetchSuggestions();
  }, []);

  // Save search to history
  const saveToHistory = (keyword) => {
    if (!keyword || keyword.trim() === '') return;

    const trimmedKeyword = keyword.trim();

    // Remove duplicate if exists and add to beginning
    const newHistory = [
      trimmedKeyword,
      ...searchHistory.filter(item => item !== trimmedKeyword)
    ].slice(0, 10); // Keep only 10 most recent searches

    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Remove single item from history
  const removeFromHistory = (keyword) => {
    const newHistory = searchHistory.filter(item => item !== keyword);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Clear all history
  const clearAllHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // Debounced search
  const handleInputChange = (value) => {
    setInput(value);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    if (value.trim()) {
      debounceTimer.current = setTimeout(() => {
        fetchUsers(value.trim());
      }, 500); // Wait 500ms after user stops typing
    } else {
      // If input is empty, fetch all users
      fetchUsers('');
    }
  };

  // Search
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const keyword = input.trim();
      if (keyword) {
        saveToHistory(keyword);
        fetchUsers(keyword);
        setShowHistory(false);
      }
    }
  };

  const handleSearchClick = () => {
    const keyword = input.trim();
    if (keyword) {
      saveToHistory(keyword);
      fetchUsers(keyword);
      setShowHistory(false);
    }
  };

  // Click on history item
  const handleHistoryClick = (keyword) => {
    setInput(keyword);
    saveToHistory(keyword);
    fetchUsers(keyword);
    setShowHistory(false);
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    if (filterType === 'all') return true;
    if (filterType === 'not-friends') return !user.isFriend;
    if (filterType === 'friends') return user.isFriend;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Khám phá mọi người
            </h1>
          </div>
          <p className="text-slate-600">
            Kết nối với những người mới và mở rộng mạng lưới của bạn
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 shadow-md rounded-xl border border-slate-200/60 bg-white/80">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4" ref={searchRef}>
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder={searchType === 'user' ? "Tìm người..." : "Tìm bài viết..."}
                  className="pl-12 pr-4 py-3 md:py-4 w-full border border-gray-300 rounded-xl text-base md:text-lg
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  onChange={(e) => handleInputChange(e.target.value)}
                  value={input}
                  onKeyUp={handleSearch}
                  onFocus={() => setShowHistory(true)}
                />

                {/* Search History Dropdown */}
                {showHistory && searchHistory.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-[300px] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">Tìm kiếm gần đây</span>
                      <button
                        onClick={clearAllHistory}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Xóa tất cả
                      </button>
                    </div>

                    {/* History Items */}
                    <div className="py-1">
                      {searchHistory.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 group cursor-pointer"
                        >
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span
                            onClick={() => handleHistoryClick(item)}
                            className="flex-1 text-sm text-gray-700"
                          >
                            {item}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(item);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-full"
                            title="Xóa"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls: Type Toggle + Search Button */}
              <div className="flex items-center gap-3">
                {/* Search Type Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 shrink-0">
                  <button
                    onClick={() => setSearchType('user')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${searchType === 'user' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    Mọi người
                  </button>
                  <button
                    onClick={() => setSearchType('post')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${searchType === 'post' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    Bài viết
                  </button>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearchClick}
                  className="flex-1 md:flex-none px-6 py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white
                    rounded-xl transition active:scale-95 font-medium whitespace-nowrap shadow-sm"
                >
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 bg-white rounded-lg shadow-sm p-1 border border-gray-200 w-fit">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filterType === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            Tất cả ({users.length})
          </button>
          <button
            onClick={() => setFilterType('not-friends')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filterType === 'not-friends'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            Chưa kết bạn ({users.filter((u) => !u.isFriend).length})
          </button>
          <button
            onClick={() => setFilterType('friends')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filterType === 'friends'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            Bạn bè ({users.filter((u) => u.isFriend).length})
          </button>
        </div>

        {/* Suggestions Section - Show when no search has been made */}
        {!hasSearched && !loading && suggestions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-800">Gợi ý cho bạn</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {suggestions.slice(0, 8).map((user) => (
                <UserCard
                  user={user}
                  key={`suggestion-${user._id || user.id}`}
                  currentUser={currentUser}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        {!loading && hasSearched && filteredUsers.length > 0 && (
          <div className="mb-4 text-sm text-slate-600">
            Tìm thấy <span className="font-semibold">{filteredUsers.length}</span> người dùng
          </div>
        )}

        {/* User List - Search Results */}
        {hasSearched && (
          <div className={searchType === 'user'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6"
            : "flex flex-col gap-6 max-w-2xl mx-auto" // Post layout
          }>

            {!loading && searchType === 'user' &&
              filteredUsers.map((user) => (
                <UserCard
                  user={user}
                  key={user._id || user.id}
                  currentUser={currentUser}
                />
              ))}

            {!loading && searchType === 'post' &&
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                  isOwner={post.user_id === currentUser?.id}
                />
              ))
            }

            {!loading && ((searchType === 'user' && filteredUsers.length === 0) || (searchType === 'post' && posts.length === 0)) && (
              <div className="col-span-full text-center py-16 w-full">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg font-medium mb-2">
                  Không tìm thấy {searchType === 'user' ? 'người dùng' : 'bài viết'} nào
                </p>
                <p className="text-slate-400 text-sm">
                  Thử tìm kiếm với từ khóa khác
                </p>
              </div>
            )}
          </div>
        )}

        {/* All Users Section - Show when no search */}
        {!hasSearched && !loading && filteredUsers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-slate-800">Tất cả người dùng</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <UserCard
                  user={user}
                  key={user._id || user.id}
                  currentUser={currentUser}
                />
              ))}
            </div>
          </div>
        )}

        {loading && <Loading height="60vh" />}
      </div>
    </div>
  );
};

export default Discover;
