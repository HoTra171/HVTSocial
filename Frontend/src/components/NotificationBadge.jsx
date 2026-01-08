import React from 'react';

const NotificationBadge = ({ count, showZero = false }) => {
  // Don't show badge if count is 0 and showZero is false
  if (!count && !showZero) return null;

  // Show dot for small counts, number for larger
  const showNumber = count > 0;
  const displayCount = count > 99 ? '99+' : count;

  return (
    <div className="absolute -top-1 -right-1 flex items-center justify-center">
      {showNumber ? (
        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
          {displayCount}
        </span>
      ) : (
        <span className="bg-red-500 w-2.5 h-2.5 rounded-full shadow-sm border-2 border-white" />
      )}
    </div>
  );
};

export default NotificationBadge;
