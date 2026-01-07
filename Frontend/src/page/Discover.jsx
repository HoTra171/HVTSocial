import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Users } from 'lucide-react';
import UserCard from '../components/UserCard';
import Loading from '../components/Loading';
import { API_URL, SERVER_ORIGIN } from '../constants/api';


const API_URL = 'http://localhost:5000/api';

const Discover = () => {
  const [input, setInput] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, not-friends, friends

  // Load current user
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Parse user error:', e);
      }
    }
  }, []);

  // Fetch users
  const fetchUsers = async (keyword = '') => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/users/discover`, {
        params: { search: keyword, filterType  },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data?.success) {
        setUsers(res.data.data || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Discover fetchUsers error:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load lần đầu
  useEffect(() => {
    fetchUsers();
  }, []);

  // Search
  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      fetchUsers(input.trim());
    }
  };

  const handleSearchClick = () => {
    fetchUsers(input.trim());
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    if (filterType === 'all') return true;
    if (filterType === 'not-friends') return !user.isFriend;
    if (filterType === 'friends') return user.isFriend;
    return true;
  });

  return (
    <div className="min-h-screen sm:-ml-46 bg-gradient-to-b from-slate-50 to-white">
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm người dùng theo tên, username, bio, hoặc địa chỉ..."
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  onChange={(e) => setInput(e.target.value)}
                  value={input}
                  onKeyUp={handleSearch}
                />
              </div>
              <button
                onClick={handleSearchClick}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white 
                rounded-lg transition active:scale-95 font-medium"
              >
                Tìm kiếm
              </button>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
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

        {/* Results Count */}
        {!loading && filteredUsers.length > 0 && (
          <div className="mb-4 text-sm text-slate-600">
            Tìm thấy <span className="font-semibold">{filteredUsers.length}</span> người dùng
          </div>
        )}

        {/* User List */}
        <div className="flex flex-wrap gap-6 justify-center">
          {!loading &&
            filteredUsers.map((user) => (
              <UserCard 
                user={user} 
                key={user._id || user.id} 
                currentUser={currentUser}
              />
            ))}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-16 w-full">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium mb-2">
                Không tìm thấy người dùng nào
              </p>
              <p className="text-slate-400 text-sm">
                Thử tìm kiếm với từ khóa khác
              </p>
            </div>
          )}
        </div>

        {loading && <Loading height="60vh" />}
      </div>
    </div>
  );
};

export default Discover;
