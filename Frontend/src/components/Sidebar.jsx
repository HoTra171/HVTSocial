import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import MenuItems from './MenuItems.jsx'
import { Link } from 'react-router-dom'
import { CirclePlus } from 'lucide-react'
import { LogOut, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentUserId, collapsed = false, relative = false }) => {
    const navigate = useNavigate();
    const { currentUser: user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Đăng xuất thành công!');
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Đăng xuất thất bại');
        }
    };


    return (
        <div className={`w-20 ${!collapsed ? 'xl:w-72' : ''} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
  ${relative ? 'relative h-full' : 'fixed top-0 left-0 bottom-0'} z-20 flex flex-col justify-between pb-5
  max-sm:hidden transition-all duration-300 ease-in-out touch-none`}>

            <div className='w-full'>
                {/* Unified Logo */}
                <div className={`flex items-center ${!collapsed ? 'xl:justify-start xl:pl-7' : 'justify-center'} justify-center my-3 cursor-pointer`}
                     onClick={() => navigate('/feed')}>
                    <img
                        src={assets.logo}
                        alt="Logo"
                        className={`transition-all duration-300 object-contain
                            w-10 h-10
                            ${!collapsed ? 'xl:w-20 xl:h-auto' : ''}
                        `}
                    />
                </div>
                <hr className='border-slate-200 dark:border-slate-800 mb-6' />

                {/* Menu Items */}
                <MenuItems setSidebarOpen={setSidebarOpen} currentUserId={currentUserId} collapsed={collapsed} />

                {/* Admin Panel Link */}
                {user?.roles?.includes('admin') && (
                    <div className='md:px-2 xl:px-6 mt-1'>
                        <Link to='/admin/dashboard' className={`py-2 flex items-center gap-3 rounded-xl relative
                            justify-center w-full ${!collapsed ? 'xl:justify-start xl:px-3.5' : 'justify-center px-0'}
                             hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition text-slate-700 dark:text-slate-200 group`}>
                            <div className="relative">
                                <ShieldAlert className='w-5 h-5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition' />
                            </div>
                            <span className={`hidden ${!collapsed ? 'xl:inline' : ''} font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400`}>Admin Panel</span>
                        </Link>
                    </div>
                )}

                <Link to='/create-post' className={`flex items-center justify-center gap-2
             py-2.5 mt-6 mx-auto w-10/12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600
            hover:from-indigo-500 hover:to-purple-500 active:scale-95 shadow-md shadow-indigo-500/20
             transition text-white cursor-pointer px-0 ${!collapsed ? 'xl:mx-6 xl:w-auto xl:px-4' : 'xl:mx-auto xl:w-10/12 xl:px-0'}`}>
                    <CirclePlus className='w-5 h-5' />
                    <span className={`hidden ${!collapsed ? 'xl:inline' : ''} font-semibold text-sm`}>Tạo bài viết</span>
                </Link>
            </div>
            <div className={`w-full border-t border-slate-200 dark:border-slate-800 p-3 px-6 flex items-center justify-between md:flex-col md:gap-3 md:px-2 ${!collapsed ? 'xl:flex-row xl:gap-0 xl:px-6' : ''}`}>
                <div 
                    onClick={() => navigate(user?.id ? `/profile/${user.id}` : '/profile')}
                    className={`flex items-center gap-2.5 cursor-pointer md:flex-col ${!collapsed ? 'xl:flex-row' : ''} p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition group flex-1 min-w-0 mr-1`}
                >
                    <img
                        src={user?.avatar || user?.profile_picture || `/default.jpg`}
                        alt={user?.full_name || 'User'}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 group-hover:ring-2 group-hover:ring-indigo-500 transition"
                        onError={(e) => { e.currentTarget.src = '/default.jpg'; }}
                    />
                    <div className={`hidden ${!collapsed ? 'xl:block' : ''} min-w-0`}>
                        <h1 className='text-xs font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition'>{user?.full_name || 'Người dùng'}</h1>
                        <p className='text-[11px] text-slate-400 truncate'>@{user?.username || 'user'}</p>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition group flex-shrink-0"
                    title="Đăng xuất"
                >
                    <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition" />
                </button>
            </div>
        </div>
    )
}

export default Sidebar
