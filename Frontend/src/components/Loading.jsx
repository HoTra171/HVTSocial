import React from 'react';

const Loading = ({ height = '100vh', message = 'Đang tải...' }) => {
  return (
    <div
      style={{ height }}
      className="flex flex-col items-center justify-center w-full bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm"
    >
      <div className="relative flex items-center justify-center">
        {/* Glowing ambient ring */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 animate-spin blur-[1px] opacity-80" />
        <div className="absolute w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
          <span className="text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            HVT
          </span>
        </div>
      </div>
      {message && (
        <p className="mt-3.5 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default Loading;
