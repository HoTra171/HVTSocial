import { useState, useEffect, useRef } from 'react';
import { Search, Users, X, Clock, UserPlus, Sparkles, FileText, Compass, TrendingUp } from 'lucide-react';
import UserCard from '../components/UserCard';
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';
import { userApi, postApi } from '../api';
import { useAuth } from '../contexts';

const Discover = () => {
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, not-friends, friends
  const [searchType, setSearchType] = useState('user'); // user, post
  const [posts, setPosts] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
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

  // Fetch users or posts using API layer
  const fetchUsers = async (keyword = '') => {
    try {
      setLoading(true);
      const trimmedKeyword = keyword.trim();
      setHasSearched(trimmedKeyword !== '');

      if (searchType === 'user') {
        const res = await userApi.discover({ search: trimmedKeyword, filterType });
        if (res.data?.success) setUsers(res.data.data || []);
        else setUsers([]);
      } else {
        const res = await postApi.search({ q: trimmedKeyword });
        if (res.data?.success) {
          const postsData = res.data.posts || res.data.data || [];
          setPosts(postsData);
        } else {
          setPosts([]);
        }
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
      const res = await userApi.getSuggestions();
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
      ...searchHistory.filter((item) => item !== trimmedKeyword),
    ].slice(0, 10);

    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // Remove single item from history
  const removeFromHistory = (keyword) => {
    const newHistory = searchHistory.filter((item) => item !== keyword);
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

    const trimmed = value.trim();

    if (trimmed) {
      debounceTimer.current = setTimeout(() => {
        fetchUsers(trimmed);
      }, 400);
    } else {
      setHasSearched(false);
      setPosts([]);
      setUsers([]);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Khám phá
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 font-medium">
                Tìm kiếm người quen, bạn bè mới và nội dung bài viết thú vị
              </p>
            </div>
          </div>
        </div>

        {/* Search Card Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 sm:p-4 mb-8">
          {/* Main Search Bar */}
          <div className="relative mb-3" ref={searchRef}>
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  searchType === 'user'
                    ? 'Nhập tên, @username hoặc email để tìm kiếm...'
                    : 'Nhập nội dung bài viết cần tìm...'
                }
                className="w-full pl-12 pr-10 py-3.5 bg-gray-50/80 hover:bg-gray-100/60 focus:bg-white rounded-2xl text-sm sm:text-base border border-transparent focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium text-gray-800 placeholder-gray-400"
                onChange={(e) => handleInputChange(e.target.value)}
                value={input}
                onKeyUp={handleSearch}
                onFocus={() => setShowHistory(true)}
              />
              {input && (
                <button
                  onClick={() => handleInputChange('')}
                  className="absolute right-3.5 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                  title="Xóa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search History Dropdown */}
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Tìm kiếm gần đây
                  </span>
                  <button
                    onClick={clearAllHistory}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Xóa lịch sử
                  </button>
                </div>
                <div className="py-1">
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50/50 group cursor-pointer transition-colors"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <Clock className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 flex-shrink-0" />
                      <span className="flex-1 text-sm text-gray-700 font-medium group-hover:text-indigo-600">
                        {item}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded-lg"
                        title="Xóa"
                      >
                        <X className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Type Segmented Controls (Users vs Posts) */}
          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
            <button
              onClick={() => setSearchType('user')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                searchType === 'user'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Mọi người</span>
            </button>
            <button
              onClick={() => setSearchType('post')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                searchType === 'post'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Bài viết</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs - Only for user search */}
        {searchType === 'user' && (
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                filterType === 'all'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              <span>Tất cả</span>
              <span
                className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
                  filterType === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setFilterType('not-friends')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                filterType === 'not-friends'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              <span>Chưa kết bạn</span>
              <span
                className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
                  filterType === 'not-friends'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {users.filter((u) => !u.isFriend).length}
              </span>
            </button>

            <button
              onClick={() => setFilterType('friends')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                filterType === 'friends'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                  : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              <span>Bạn bè</span>
              <span
                className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
                  filterType === 'friends'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {users.filter((u) => u.isFriend).length}
              </span>
            </button>
          </div>
        )}

        {/* Suggestions Section - When not searching */}
        {!hasSearched && !loading && searchType === 'user' && suggestions.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Gợi ý cho bạn</h2>
              </div>
              <span className="text-xs text-gray-400 font-medium">Những người bạn có thể biết</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Results Header */}
        {!loading && hasSearched && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600 font-medium">
              {searchType === 'user' ? (
                <>
                  Tìm thấy{' '}
                  <span className="font-bold text-indigo-600">{filteredUsers.length}</span> người
                  dùng phù hợp
                </>
              ) : (
                <>
                  Tìm thấy{' '}
                  <span className="font-bold text-indigo-600">{posts.length}</span> bài viết phù
                  hợp
                </>
              )}
            </p>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && (
          <div
            className={
              searchType === 'user'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'flex flex-col gap-5 max-w-2xl mx-auto'
            }
          >
            {!loading &&
              searchType === 'user' &&
              filteredUsers.map((user) => (
                <UserCard user={user} key={user._id || user.id} currentUser={currentUser} />
              ))}

            {!loading &&
              searchType === 'post' &&
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser?.id}
                  isOwner={post.user_id === currentUser?.id}
                />
              ))}

            {!loading &&
              ((searchType === 'user' && filteredUsers.length === 0) ||
                (searchType === 'post' && posts.length === 0)) && (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-gray-400 shadow-inner">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">
                    Không tìm thấy {searchType === 'user' ? 'người dùng' : 'bài viết'} nào
                  </h3>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto">
                    Vui lòng kiểm tra lại chính tả hoặc thử tìm kiếm với từ khóa khác.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* All Users Section - When not searching */}
        {!hasSearched && !loading && searchType === 'user' && filteredUsers.length > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                <UserPlus className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Tất cả người dùng</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <UserCard user={user} key={user._id || user.id} currentUser={currentUser} />
              ))}
            </div>
          </div>
        )}

        {loading && <Loading height="50vh" />}
      </div>
    </div>
  );
};

export default Discover;
