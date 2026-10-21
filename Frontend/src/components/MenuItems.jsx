import { useState } from 'react';
import { menuItemsData } from '../assets/assets';
import { NavLink } from 'react-router-dom';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import NotificationBadge from './NotificationBadge';
import NotificationDropdown from './Notification/NotificationDropdown';

const MenuItems = ({ setSidebarOpen, collapsed }) => {
  const { unreadMessages, unreadNotifications, pendingFriendRequests } = useUnreadCounts();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const getBadgeCount = (to) => {
    if (to === '/messages') return unreadMessages;
    if (to === '/notifications') return unreadNotifications;
    if (to === '/connections') return pendingFriendRequests;
    return 0;
  };

  return (
    <div className="md:px-2 xl:px-6 text-gray-600 space-y-1 font-medium">
      {menuItemsData.map(({ to, label, Icon }) => {
        const badgeCount = getBadgeCount(to);
        const isNotif = to === '/notifications';

        if (isNotif) {
          return (
            <div key={to} className="relative">
              <button
                type="button"
                onClick={() => setShowNotifDropdown((prev) => !prev)}
                className={`py-2 flex items-center gap-3 rounded-xl relative justify-center w-full ${
                  !collapsed ? 'xl:justify-start xl:px-3.5' : 'xl:justify-center xl:px-2'
                } ${
                  showNotifDropdown ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'
                } transition-colors`}
                title={label}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  <NotificationBadge count={badgeCount} />
                </div>
                <span className={`hidden ${!collapsed ? 'xl:inline' : ''}`}>{label}</span>
              </button>

              <NotificationDropdown
                isOpen={showNotifDropdown}
                onClose={() => setShowNotifDropdown(false)}
                placement="sidebar"
              />
            </div>
          );
        }

        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `py-2 flex items-center gap-3 rounded-xl relative justify-center w-full ${
                !collapsed ? 'xl:justify-start xl:px-3.5' : 'xl:justify-center xl:px-2'
              } ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'} transition-colors`
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              <NotificationBadge count={badgeCount} />
            </div>
            <span className={`hidden ${!collapsed ? 'xl:inline' : ''}`}>{label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default MenuItems
