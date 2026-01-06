import React from 'react';
import { Bell } from 'lucide-react';

const NotificationHeader = () => {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-indigo-50">
        <Bell className="w-6 h-6 text-indigo-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
        <p className="text-sm text-gray-500">
          Xem tất cả thông báo gần đây của bạn
        </p>
      </div>
    </div>
  );
};

export default NotificationHeader;
