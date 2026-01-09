import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Users, X, Clock, UserPlus, Sparkles } from 'lucide-react';
import UserCard from '../components/UserCard';
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';
import { API_URL } from '../constants/api';

const Discover = () => {
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, not-friends, friends
  const [searchType, setSearchType] = useState('user'); // user, post
  const [posts, setPosts] = useState([]);
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

  // Fetch suggestions
  const fetchSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/users/suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
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

  // Re-fetch when search type changes
  useEffect(() => {
    if (hasSearched && input.trim()) {
      fetchUsers(input.trim());
    }
  }, [searchType]);

  // Save search to history
  const saveToHistory = (keyword) => {
    if (!keyword || keyword.trim() === '') return;

    const trimmedKeyword = keyword.trim();
    const newHistory = [
      trimmedKeyword,
      ...searchHistory.filter(item => item !== trimmedKeyword)
    ].slice(0, 10);

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

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.trim()) {
      debounceTimer.current = setTimeout(() => {
        fetchUsers(value.trim());
      }, 500);
    } else {
      fetchUsers('');
    }
  };

  // Search on Enter
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Tìm kiếm
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Tìm kiếm người dùng và bài viết trên HVT Social
          </p>
        </div>

        {/* Search Card - Facebook Style */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSearchType('user')}
              className={`flex-1 px-4 py-3 md:px-6 md:py-4 text-center font-semibold transition-all relative ${
                searchType === 'user'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5 inline-block mr-2" />
              <span className="hidden sm:inline">Mọi người</span>
              <span className="sm:hidden">Người</span>
              {searchType === 'user' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t"></div>
              )}
            </button>
            <button
              onClick={() => setSearchType('post')}
              className={`flex-1 px-4 py-3 md:px-6 md:py-4 text-center font-semibold transition-all relative ${
                searchType === 'post'
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Search className="w-5 h-5 inline-block mr-2" />
              <span className="hidden sm:inline">Bài viết</span>
              <span className="sm:hidden">Bài</span>
              {searchType === 'post' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t"></div>
              )}
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={searchType === 'user' ? "Tìm kiếm người dùng..." : "Tìm kiếm bài viết..."}
                className="pl-10 pr-4 py-3 w-full bg-gray-100 rounded-full text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                onChange={(e) => handleInputChange(e.target.value)}
                value={input}
                onKeyUp={handleSearch}
                onFocus={() => setShowHistory(true)}
              />

              {/* Search History Dropdown */}
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-[300px] overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Tìm kiếm gần đây</span>
                    <button
                      onClick={clearAllHistory}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Xóa tất cả
                    </button>
                  </div>
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
          </div>
        </div>

        {/* Filter Tabs - Only show for user search */}
        {searchType === 'user' && (
          <div className="mb-6 flex gap-2 bg-white rounded-lg shadow-sm p-1 border border-gray-200 w-fit">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Tất cả ({users.length})
            </button>
            <button
              onClick={() => setFilterType('not-friends')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filterType === 'not-friends'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Chưa kết bạn ({users.filter((u) => !u.isFriend).length})
            </button>
            <button
              onClick={() => setFilterType('friends')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filterType === 'friends'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Bạn bè ({users.filter((u) => u.isFriend).length})
            </button>
          </div>
        )}

        {/* Suggestions Section - Show when no search for users */}
        {!hasSearched && !loading && searchType === 'user' && suggestions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Gợi ý cho bạn</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.slice(0, 6).map((user) => (
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
        {!loading && hasSearched && (
          <div className="mb-4 text-sm text-gray-600">
            {searchType === 'user' ? (
              <>Tìm thấy <span className="font-semibold">{filteredUsers.length}</span> người dùng</>
            ) : (
              <>Tìm thấy <span className="font-semibold">{posts.length}</span> bài viết</>
            )}
          </div>
        )}

        {/* Search Results */}
        {hasSearched && (
          <div className={searchType === 'user'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "flex flex-col gap-4 max-w-2xl mx-auto"
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
              ))}

            {!loading && ((searchType === 'user' && filteredUsers.length === 0) || (searchType === 'post' && posts.length === 0)) && (
              <div className="col-span-full text-center py-16 w-full">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg font-medium mb-2">
                  Không tìm thấy {searchType === 'user' ? 'người dùng' : 'bài viết'} nào
                </p>
                <p className="text-gray-500 text-sm">
                  Thử tìm kiếm với từ khóa khác
                </p>
              </div>
            )}
          </div>
        )}

        {/* All Users Section - Show when no search */}
        {!hasSearched && !loading && searchType === 'user' && filteredUsers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Tất cả người dùng</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
