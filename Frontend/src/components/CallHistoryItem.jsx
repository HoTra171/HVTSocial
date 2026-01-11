import React from 'react';
import { Video, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

// Helper for Vietnamese date
dayjs.extend(relativeTime);
dayjs.locale('vi');

const CallHistoryItem = ({ callHistory, currentUserId }) => {
  const { caller_id, receiver_id, call_type, status, duration, created_at } = callHistory;

  // Determine call direction
  const isIncoming = receiver_id === currentUserId;
  const isMissed = status === 'missed' || status === 'rejected' || (status === 'callee_busy'); // Treat rejected/busy as missed/failed

  // Choose icon
  const getCallIcon = () => {
    if (isMissed) return <PhoneMissed size={20} className="text-white" />;
    if (call_type === 'video') return <Video size={20} className="text-white" />;
    return <Phone size={20} className="text-white" />;
  };

  // Icon background color
  const getIconBg = () => {
    if (isMissed) return 'bg-red-500';
    return isIncoming ? 'bg-gray-500' : 'bg-green-500'; // Gray for incoming, Green for outgoing (standard convention)
  };

  // Format description
  const getCallDescription = () => {
    const typeStr = call_type === 'video' ? 'Video call' : 'Cuộc gọi thoại';
    if (isMissed) {
      return isIncoming ? 'Cuộc gọi nhỡ' : 'Người dùng không bắt máy';
    }
    return isIncoming ? `${typeStr} đến` : `${typeStr} đi`;
  };

  // Format duration
  const formatDuration = () => {
    if (isMissed || !duration) return 'Bỏ lỡ';
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins} phút ${secs} giây`;
  };

  return (
    <div className="flex justify-center my-4 w-full">
      <div className="flex items-center gap-3 bg-gray-100/80 px-4 py-2 rounded-2xl shadow-sm backdrop-blur-sm max-w-xs">

        {/* Icon Circle */}
        <div className={`flex shrink-0 items-center justify-center w-10 h-10 rounded-full shadow-sm ${getIconBg()}`}>
          {getCallIcon()}
        </div>

        {/* Text Info */}
        <div className="flex flex-col text-sm">
          <p className={`font-semibold ${isMissed ? 'text-red-500' : 'text-gray-800'}`}>
            {getCallDescription()}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{formatDuration()}</span>
            <span>•</span>
            <span title={new Date(created_at).toLocaleString('vi-VN')}>
              {dayjs(created_at).fromNow()}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CallHistoryItem;
