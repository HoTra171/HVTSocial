import React from 'react';
import { Check } from 'lucide-react';

const NotificationFilters = ({
  filter,
  setFilter,
  totalCount,
  unreadCount,
  marking,
  onMarkAllRead,
}) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`text-sm px-4 py-2 rounded-lg font-medium transition ${filter === 'all'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Tất cả ({totalCount})
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`text-sm px-4 py-2 rounded-lg font-medium transition ${filter === 'unread'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Chưa đọc ({unreadCount})
        </button>

        <button
          onClick={() => setFilter('read')}
          className={`text-sm px-4 py-2 rounded-lg font-medium transition ${filter === 'read'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          Đã đọc ({totalCount - unreadCount})
        </button>
      </div>

      {unreadCount > 0 && (
        <button
          onClick={onMarkAllRead}
          disabled={marking}
          className="text-sm px-4 py-2 rounded-lg bg-white border border-gray-300
          hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {marking ? 'Đang cập nhật...' : 'Đánh dấu đã đọc tất cả'}
        </button>
      )}
    </div>
  );
};

export default NotificationFilters;
