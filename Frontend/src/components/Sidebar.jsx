import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import MenuItems from './MenuItems.jsx'
import { Link } from 'react-router-dom'
import { CirclePlus } from 'lucide-react'
import { LogOut } from 'lucide-react'
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
        <div className={`w-60 xl:w-72 bg-white border-r border-gray-200
  fixed top-0 left-0 bottom-0 z-20 flex flex-col justify-between
  max-sm:hidden transition-all duration-300 ease-in-out touch-none`}>

            <div className='w-full'>
                <img onClick={() => navigate('/feed')} src={assets.logo} alt="Logo" className='w-26 ml-7 my-2 cursor-pointer' />
                <hr className='border-gray-300 mb-8' />

                {/* Menu Items */}
                <MenuItems setSidebarOpen={setSidebarOpen} currentUserId={currentUserId} />

                <Link to='/create-post' className='flex items-center justify-center gap-2
             py-2.5 mt-6 mx-6 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600
            hover:from-indigo-700 hover:to-purple-800 active:scale-95
             transition text-white cursor-pointer'>
                    <CirclePlus className='w-5 h-5' />
                    Tạo bài viết
                </Link>
            </div>
            <div className='w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between'>
                <div className='flex items-center gap-2 cursor-pointer'>
                    <img
                        src={user.avatar || user.profile_picture || `/default.jpg`}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full"
                    />
                    <div>
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
