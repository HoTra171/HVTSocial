import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Users, Plus, MessageCircle } from 'lucide-react'
import NotificationBadge from './NotificationBadge'
import { useUnreadCounts } from '../hooks/useUnreadCounts'

const BottomNav = ({ currentUserId, onOpenCreatePost }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const { unreadMessages, pendingFriendRequests } = useUnreadCounts();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 sm:hidden">
            <div className="flex items-center justify-around h-14 w-full px-2">
                {/* Home */}
                <NavLink
                    to="/feed"
                    className={({ isActive }) =>
                        `relative flex items-center justify-center w-11 h-11 transition-colors ${isActive
                            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`
                    }
                    title="Bảng tin"
                >
                    <Home size={22} strokeWidth={2} />
                </NavLink>

                {/* Connections / Friends */}
                <NavLink
                    to="/connections"
                    className={({ isActive }) =>
                        `relative flex items-center justify-center w-11 h-11 transition-colors ${isActive
                            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`
                    }
                    title="Bạn bè"
                >
                    <div className="relative">
                        <Users size={22} strokeWidth={2} />
                        <NotificationBadge count={pendingFriendRequests} />
                    </div>
                </NavLink>

                {/* Center: Create Post (Instagram/Facebook Style) */}
                <button
                    type="button"
                    onClick={onOpenCreatePost}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md active:scale-95 transition-transform cursor-pointer"
                    title="Tạo bài viết"
                >
                    <Plus size={22} strokeWidth={2.5} />
                </button>

                {/* Messages */}
                <NavLink
                    to="/messages"
                    className={({ isActive }) =>
                        `relative flex items-center justify-center w-11 h-11 transition-colors ${isActive
                            ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`
                    }
                    title="Tin nhắn"
                >
                    <div className="relative">
                        <MessageCircle size={22} strokeWidth={2} />
                        <NotificationBadge count={unreadMessages} />
                    </div>
                </NavLink>

                {/* Profile */}
                <NavLink
                    to={user?.id ? `/profile/${user.id}` : '/profile'}
                    className={({ isActive }) =>
                        `relative flex items-center justify-center w-11 h-11 transition-transform ${isActive ? 'scale-105' : ''}`
                    }
                    title="Trang cá nhân"
                >
                    {({ isActive }) => (
                        <img
                            src={user?.avatar || user?.profile_picture || '/default.jpg'}
                            alt="Profile"
                            className={`w-7 h-7 rounded-full object-cover transition-all ${
                                isActive
                                    ? 'border-2 border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900'
                                    : 'border border-slate-300 dark:border-slate-700'
                            }`}
                            onError={(e) => { e.currentTarget.src = '/default.jpg'; }}
                        />
                    )}
                </NavLink>
            </div>
        </div>
    );
};

export default BottomNav
