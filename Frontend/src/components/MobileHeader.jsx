import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, Sun, Moon } from 'lucide-react';
import { assets } from '../assets/assets';
import NotificationBadge from './NotificationBadge';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import { useTheme } from '../contexts/ThemeContext';
import NotificationDropdown from './Notification/NotificationDropdown';
import MobileSettingsMenu from './MobileSettingsMenu';

const MobileHeader = ({ currentUserId }) => {
    const navigate = useNavigate();
    const { unreadNotifications } = useUnreadCounts();
    const { isDark, toggleTheme } = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    return (
        <>
            <div className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40 sm:hidden">
                <div className="flex items-center justify-between h-14 px-4 relative">
                    {/* Left: Brand / Logo */}
                    <div
                        onClick={() => navigate('/feed')}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <img
                            src={assets.logo}
                            alt="HVTSocial"
                            className="h-8 w-auto object-contain"
                        />
                        <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            HVTSocial
                        </span>
                    </div>

                    {/* Right: Theme Toggle, Search, Notifications, Menu */}
                    <div className="flex items-center gap-1">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center w-9 h-9 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title={isDark ? "Giao diện sáng" : "Giao diện tối"}
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <Sun size={20} className="text-amber-400" />
                            ) : (
                                <Moon size={20} className="text-slate-600" />
                            )}
                        </button>

                        {/* Search Button */}
                        <button
                            onClick={() => navigate('/discover')}
                            className="flex items-center justify-center w-9 h-9 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Tìm kiếm"
                        >
                            <Search size={20} strokeWidth={2} />
                        </button>

                        {/* Notifications Icon & Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown((prev) => !prev)}
                                className={`flex items-center justify-center w-9 h-9 rounded-full transition ${
                                    showDropdown
                                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title="Thông báo"
                            >
                                <div className="relative">
                                    <Bell size={20} strokeWidth={2} />
                                    <NotificationBadge count={unreadNotifications} />
                                </div>
                            </button>

                            <NotificationDropdown
                                isOpen={showDropdown}
                                onClose={() => setShowDropdown(false)}
                                placement="header"
                            />
                        </div>

                        {/* Hamburger Settings Menu */}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="flex items-center justify-center w-9 h-9 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Cài đặt"
                        >
                            <Menu size={20} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Settings Drawer */}
            <MobileSettingsMenu
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </>
    );
};

export default MobileHeader;
