import React from 'react';
import { BellOff, CheckCircle } from 'lucide-react';

const EmptyNotifications = ({ filter }) => {
  const isUnread = filter === 'unread';

  return (
    <div className="text-center py-20 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm my-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto mb-4 flex items-center justify-center shadow-inner">
        {isUnread ? (
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        ) : (
          <BellOff className="w-8 h-8 text-indigo-400" />
        )}
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1">
        {isUnread ? 'Bạn đã xem hết thông báo!' : 'Chưa có thông báo nào'}
      </h3>
      <p className="text-sm text-gray-400 max-w-sm mx-auto">
        {isUnread
          ? 'Không có thông báo chưa đọc nào. Bạn luôn cập nhật kịp thời mọi hoạt động!'
          : 'Khi có bạn bè tương tác, thích bài viết hoặc bình luận, bạn sẽ nhận được thông báo tại đây.'}
      </p>
    </div>
  );
};

export default EmptyNotifications;
