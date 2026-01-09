import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import toast from 'react-hot-toast';
import { Search, Lock, Unlock, Users, FileText, MessageSquare, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ users: 0, posts: 0, comments: 0 });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Check admin role
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const roles = user.roles || [];
            if (!roles.includes('admin')) {
                toast.error('Bạn không có quyền truy cập');
                navigate('/feed');
            }
        } else {
            navigate('/');
        }
    }, [navigate]);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { page, limit: 10, q: searchTerm }
            });
            if (res.data.success) {
                setUsers(res.data.data.users);
                setTotalPages(res.data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    const handleLockUser = async (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        // const reason = newStatus === 'suspended' ? prompt('Lý do khóa:') : null;
        // if (newStatus === 'suspended' && !reason) return;

        if (!window.confirm(`Bạn có chắc muốn ${newStatus === 'suspended' ? 'KHÓA' : 'MỞ KHÓA'} tài khoản này?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/admin/users/${userId}/status`,
                { status: newStatus, reason: 'Admin action' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Cập nhật thành công');
            fetchUsers();
        } catch (error) {
            toast.error('Thao tác thất bại');
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [page, searchTerm]);

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 pb-20 sm:pb-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-6 sm:mb-8">
                    <button
                        onClick={() => navigate('/feed')}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                        title="Quay lại trang chủ"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
                        <div className="p-4 bg-blue-100 rounded-full mr-4">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Tổng Users</p>
                            <h3 className="text-2xl font-bold">{stats.users}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
                        <div className="p-4 bg-green-100 rounded-full mr-4">
                            <FileText className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Tổng Posts</p>
                            <h3 className="text-2xl font-bold">{stats.posts}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
                        <div className="p-4 bg-purple-100 rounded-full mr-4">
                            <MessageSquare className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Tổng Comments</p>
                            <h3 className="text-2xl font-bold">{stats.comments}</h3>
                        </div>
                    </div>
                </div>

                {/* Users Management */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Quản lý người dùng</h2>
                        <div className="relative w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Tìm kiếm user..."
                                className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Username</th>
                                    <th className="px-6 py-3">Ngày tạo</th>
                                    <th className="px-6 py-3">Trạng thái</th>
                                    <th className="px-6 py-3">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center py-4">Đang tải...</td></tr>
                                ) : users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 flex items-center">
                                            <img src={user.avatar || "https://ui-avatars.com/api/?name=" + user.full_name}
                                                alt="" className="w-8 h-8 rounded-full mr-3" />
                                            <span className="font-medium text-gray-900">{user.full_name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 text-gray-600">@{user.username}</td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${user.account_status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.account_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleLockUser(user.id, user.account_status)}
                                                className={`p-2 rounded hover:bg-gray-200 ${user.account_status === 'active' ? 'text-red-500' : 'text-green-500'
                                                    }`}
                                                title={user.account_status === 'active' ? 'Khóa' : 'Mở khóa'}
                                            >
                                                {user.account_status === 'active' ? <Lock size={18} /> : <Unlock size={18} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="px-3 py-1">Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
