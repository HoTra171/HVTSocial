import { menuItemsData } from '../assets/assets'
import { NavLink } from 'react-router-dom'
import { useUnreadCounts } from '../hooks/useUnreadCounts'
import NotificationBadge from './NotificationBadge'

const MenuItems = ({setSidebarOpen}) => {
  const { unreadMessages, unreadNotifications, pendingFriendRequests } = useUnreadCounts();

  const getBadgeCount = (to) => {
    if (to === '/messages') return unreadMessages;
    if (to === '/notifications') return unreadNotifications;
    if (to === '/connections') return pendingFriendRequests;
    return 0;
  };

  return (
    <div className='md:px-2 xl:px-6 text-gray-600 space-y-1 font-medium'>
      {
        menuItemsData.map(({to, label, Icon}) => {
          const badgeCount = getBadgeCount(to);

          return (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setSidebarOpen(false)}
            className={({isActive}) => `px-3.5 py-2 flex items-center gap-3 rounded-xl relative
            md:justify-center md:px-6 xl:justify-start xl:px-3.5
            ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
              <div className="relative">
                <Icon className='w-5 h-5'/>
                <NotificationBadge count={badgeCount} />
              </div>
              <span className="md:hidden xl:inline">{label}</span>
            </NavLink>
          );
        })
      }
    </div>
  )
}

export default MenuItems
