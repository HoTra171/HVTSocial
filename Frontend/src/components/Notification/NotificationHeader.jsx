import React from 'react';
import { Bell, Sparkles } from 'lucide-react';

const NotificationHeader = () => {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Thông báo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            Cập nhật những hoạt động và tương tác mới nhất của bạn
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationHeader;
