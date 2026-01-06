import React from 'react';
import { Bell } from 'lucide-react';

const EmptyNotifications = ({ filter }) => {
  return (
    <div className="text-center py-20">
      <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 mb-2">
        {filter === 'unread'
          ? 'Bạn đã đọc tất cả thông báo'
          : 'Chưa có thông báo nào'}
      </p>
      <p className="text-gray-400 text-sm">
        Thông báo sẽ xuất hiện khi có hoạt động mới
      </p>
    </div>
  );
};

export default EmptyNotifications;
