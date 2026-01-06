import React from 'react';
import { Trash2 } from 'lucide-react';
import { safeFromNow } from '../../utils/dateHelpers';
import NotificationIcon from './NotificationIcon';

const NotificationItem = ({ notif, onRead, onDelete }) => {
  return (
    <div
      className={`group relative flex gap-3 p-4 rounded-xl border transition-all
      cursor-pointer ${notif.status === 'unread'
          ? 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'
          : 'bg-white border-gray-100 hover:bg-gray-50'
        }`}
      onClick={onRead}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {notif.sender_avatar ? (
          <img
            src={notif.sender_avatar}
            alt={notif.sender_name || 'User'}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
            {notif.sender_name?.[0] || 'N'}
          </div>
        )}

        {/* Type Icon Badge */}
        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 border-2 border-white">
          <NotificationIcon type={notif.type} content={notif.content} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold text-gray-900">
            {notif.sender_name || 'Hệ thống'}
          </span>{' '}
          <span className="text-gray-700">{notif.content}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {safeFromNow(notif.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notif.id);
          }}
          className="p-2 hover:bg-red-50 rounded-lg transition"
          title="Xóa"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>

      {/* Unread indicator */}
      {notif.status === 'unread' && (
        <span className="absolute top-4 right-4 w-2 h-2 bg-indigo-600 rounded-full" />
      )}
    </div>
  );
};

export default NotificationItem;
