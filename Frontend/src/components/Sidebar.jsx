import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import MenuItems from './MenuItems.jsx'
import { Link } from 'react-router-dom'
import { CirclePlus } from 'lucide-react'
import { LogOut, ShieldAlert } from 'lucide-react'
import { disconnectSocket } from '../socket'
import toast from 'react-hot-toast'
import { useState } from 'react'

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentUserId }) => {

    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const handleLogout = () => {
        try {
            disconnectSocket();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.success('Đăng xuất thành công!');
            navigate('/');
            setTimeout(() => window.location.reload(), 100);
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Đăng xuất thất bại');
        }
    };


    return (
        <div className={`w-20 xl:w-72 bg-white border-r border-gray-200
  fixed top-0 left-0 bottom-0 z-20 flex flex-col justify-between
  max-sm:hidden transition-all duration-300 ease-in-out touch-none`}>

            <div className='w-full'>
                <img onClick={() => navigate('/feed')} src={assets.logo} alt="Logo" className='w-26 ml-7 my-2 cursor-pointer xl:block md:hidden' />
                <div className='md:flex xl:hidden items-center justify-center my-3'>
                    <img onClick={() => navigate('/feed')} src={assets.logo} alt="Logo" className='w-10 h-10 cursor-pointer' />
                </div>
                <hr className='border-gray-300 mb-8' />

                {/* Menu Items */}
                <MenuItems setSidebarOpen={setSidebarOpen} currentUserId={currentUserId} />

                {/* Admin Panel Link */}
                {user?.roles?.includes('admin') && (
                    <Link to='/admin/dashboard' className='px-3.5 py-2 flex items-center gap-3 rounded-xl relative
                        md:justify-center md:px-6 xl:justify-start xl:px-3.5
                         hover:bg-indigo-50 transition text-gray-700 group'>
                        <div className="relative">
                            <ShieldAlert className='w-5 h-5 group-hover:text-indigo-600 transition' />
                        </div>
                        <span className='md:hidden xl:inline font-medium group-hover:text-indigo-600'>Admin Panel</span>
                    </Link>
                )}

                <Link to='/create-post' className='flex items-center justify-center gap-2
             py-2.5 mt-6 mx-6 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600
            hover:from-indigo-700 hover:to-purple-800 active:scale-95
             transition text-white cursor-pointer md:mx-2 md:px-2 xl:mx-6'>
                    <CirclePlus className='w-5 h-5' />
                    <span className='md:hidden xl:inline'>Tạo bài viết</span>
                </Link>
            </div>
            <div className='w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between md:flex-col md:gap-3 md:px-2 xl:flex-row xl:gap-0 xl:px-7'>
                <div className='flex items-center gap-2 cursor-pointer md:flex-col xl:flex-row'>
                    <img
                        src={user.avatar || user.profile_picture || `/default.jpg`}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full"
                    />
                    <div className='md:hidden xl:block'>
                        <h1 className='text-sm font-medium'>{user.full_name}</h1>
                        <p className='text-xs text-gray-500'>@{user.username}</p>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-red-50 rounded-lg transition group"
                    title="Đăng xuất"
                >
                    <LogOut className="w-4.5 text-gray-400 group-hover:text-red-500" />
                </button>
            </div>
        </div>
    )
}

export default Sidebar
