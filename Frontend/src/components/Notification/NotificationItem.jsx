import React from 'react';
import { Trash2, Clock } from 'lucide-react';
import { safeFromNow } from '../../utils/dateHelpers';
import NotificationIcon from './NotificationIcon';

const NotificationItem = ({ notif, onRead, onDelete }) => {
  const isUnread = notif.status === 'unread' || notif.is_read === false;

  return (
    <div
      className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-sm ${
        isUnread
          ? 'bg-gradient-to-r from-indigo-50/70 via-white to-white border-indigo-200/80 hover:shadow-md'
          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/70 hover:shadow-md'
      }`}
      onClick={onRead}
    >
      {/* Avatar & Type Badge */}
      <div className="relative flex-shrink-0">
        <img
          src={notif.sender_avatar || '/default.jpg'}
          alt={notif.sender_name || 'User'}
          className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-white border border-gray-100"
          onError={(e) => {
            e.currentTarget.src = '/default.jpg';
          }}
        />

        {/* Type Icon Badge */}
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-gray-100 flex items-center justify-center">
          <NotificationIcon type={notif.type} content={notif.content} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        <p className="text-sm leading-relaxed text-gray-800">
          <span className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
            {notif.sender_name || 'Hệ thống'}
          </span>{' '}
          <span className="text-gray-700">{notif.content}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1 font-medium">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          {safeFromNow(notif.created_at || notif.createdAt)}
        </p>
      </div>

      {/* Unread indicator */}
      {isUnread && (
        <span className="absolute top-5 right-12 w-2.5 h-2.5 bg-indigo-600 rounded-full ring-4 ring-indigo-100 animate-pulse" />
      )}

      {/* Actions */}
      <div className="absolute top-3.5 right-3 opacity-0 group-hover:opacity-100 transition-all duration-150">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notif.id);
          }}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          title="Xóa thông báo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
