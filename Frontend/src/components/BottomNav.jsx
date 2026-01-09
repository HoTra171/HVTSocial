import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Search, MessageCircle, Users } from 'lucide-react'
import NotificationBadge from './NotificationBadge'
import { useUnreadCounts } from '../hooks/useUnreadCounts'

const BottomNav = ({ currentUserId }) => {
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user')
        return storedUser ? JSON.parse(storedUser) : null
    })

    const { unreadMessages, pendingFriendRequests } = useUnreadCounts()

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 sm:hidden">
            <div className="flex items-center justify-evenly h-14 w-full px-2">
                {/* Home */}
                <NavLink
                    to="/feed"
                    className={({ isActive }) =>
                        `relative flex items-center justify-center w-10 h-10 transition-colors ${isActive
                            ? 'text-indigo-600'
                            : 'text-gray-600'
                        }`
                    }
                >
                    <Home size={24} strokeWidth={1.5} />
                </NavLink>

                {/* Search */}
                <NavLink
                    to="/discover"
                    className={({ isActive }) =>
                        `relative flex items-center justify-center w-10 h-10 transition-colors ${isActive
                            ? 'text-indigo-600'
                            : 'text-gray-600'
                        }`
                    }
                >
                    <Search size={24} strokeWidth={1.5} />
                </NavLink>

                {/* Messages */}
                <NavLink
                    to="/messages"
                    className={({ isActive }) =>
                        `relative flex items-center justify-center w-10 h-10 transition-colors ${isActive
                            ? 'text-indigo-600'
                            : 'text-gray-600'
                        }`
                    }
                >
                    <div className="relative">
                        <MessageCircle size={24} strokeWidth={1.5} />
                        <NotificationBadge count={unreadMessages} />
                    </div>
                </NavLink>

                {/* Connections */}
                <NavLink
                    to="/connections"
                    className={({ isActive }) =>
                        `relative flex items-center justify-center w-10 h-10 transition-colors ${isActive
                            ? 'text-indigo-600'
                            : 'text-gray-600'
                        }`
                    }
                >
                    <div className="relative">
                        <Users size={24} strokeWidth={1.5} />
                        <NotificationBadge count={pendingFriendRequests} />
                    </div>
                </NavLink>

                {/* Profile */}
                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        `relative flex items-center justify-center w-10 h-10 transition-colors ${isActive
                            ? 'text-indigo-600'
                            : 'text-gray-600'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <div className={`relative ${isActive ? 'ring-2 ring-indigo-600 rounded-full' : ''}`}>
                            <img
                                src={user?.avatar || user?.profile_picture || '/default.jpg'}
                                alt={user?.full_name || 'User'}
                                className="w-7 h-7 rounded-full object-cover"
                            />
                        </div>
                    )}
                </NavLink>
            </div>
        </div>
    )
}

export default BottomNav
