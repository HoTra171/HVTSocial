import React from 'react';
import { CheckCheck, Inbox, BellDot, CheckCircle2 } from 'lucide-react';

const NotificationFilters = ({
  filter,
  setFilter,
  totalCount,
  unreadCount,
  marking,
  onMarkAllRead,
}) => {
  const readCount = Math.max(0, totalCount - unreadCount);

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 mb-6 bg-white p-2 sm:p-2.5 rounded-2xl border border-gray-100 shadow-sm">
      {/* Pill tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs sm:text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-150 flex items-center gap-2 ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Tất cả</span>
          <span
            className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
              filter === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-200/80 text-gray-700'
            }`}
          >
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`text-xs sm:text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-150 flex items-center gap-2 ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
          }`}
        >
          <BellDot className="w-4 h-4" />
          <span>Chưa đọc</span>
          {unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
                filter === 'unread' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilter('read')}
          className={`text-xs sm:text-sm px-4 py-2 rounded-xl font-semibold transition-all duration-150 flex items-center gap-2 ${
            filter === 'read'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã đọc</span>
          <span
            className={`px-1.5 py-0.5 text-[11px] rounded-full font-bold ${
              filter === 'read' ? 'bg-indigo-500 text-white' : 'bg-gray-200/80 text-gray-700'
            }`}
          >
            {readCount}
          </span>
        </button>
      </div>

      {/* Mark All Read Button */}
      {unreadCount > 0 && (
        <button
          onClick={onMarkAllRead}
          disabled={marking}
          className="text-xs sm:text-sm px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm active:scale-95"
        >
          <CheckCheck className="w-4 h-4" />
          <span>{marking ? 'Đang cập nhật...' : 'Đánh dấu tất cả đã đọc'}</span>
        </button>
      )}
    </div>
  );
};

export default NotificationFilters;
