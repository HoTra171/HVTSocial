import React from 'react';
import { Bell, Sparkles } from 'lucide-react';

const NotificationHeader = () => {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Thông báo
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Cập nhật những hoạt động và tương tác mới nhất của bạn
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationHeader;
