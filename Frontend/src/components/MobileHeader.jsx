import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CirclePlus, Bell } from 'lucide-react';
import { assets } from '../assets/assets';
import NotificationBadge from './NotificationBadge';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import NotificationDropdown from './Notification/NotificationDropdown';

const MobileHeader = ({ currentUserId }) => {
    const navigate = useNavigate();
    const { unreadNotifications } = useUnreadCounts();
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 sm:hidden">
            <div className="flex items-center justify-between h-14 px-4 relative">
                {/* Left: Create Post Icon */}
                <button
                    onClick={() => navigate('/create-post')}
                    className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Tạo bài viết"
                >
                    <CirclePlus size={26} strokeWidth={1.5} />
                </button>

                {/* Center: Logo */}
                <img
                    src={assets.logo}
                    alt="Logo"
                    onClick={() => navigate('/feed')}
                    className="h-8 cursor-pointer"
                />

                {/* Right: Notifications Icon & Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown((prev) => !prev)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                            showDropdown ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        title="Thông báo"
                    >
                        <div className="relative">
                            <Bell size={26} strokeWidth={1.5} />
                            <NotificationBadge count={unreadNotifications} />
                        </div>
                    </button>

                    <NotificationDropdown
                        isOpen={showDropdown}
                        onClose={() => setShowDropdown(false)}
                        placement="header"
                    />
                </div>
            </div>
        </div>
    );
};

export default MobileHeader;
