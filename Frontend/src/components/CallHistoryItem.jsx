import React from 'react';
import { Video, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

// Helper for Vietnamese date
dayjs.extend(relativeTime);
dayjs.locale('vi');

const CallHistoryItem = ({ callHistory, currentUserId, onCallBack }) => {
  const { caller_id, receiver_id, call_type, status, duration, created_at } = callHistory;

  // Determine call direction
  const isIncoming = receiver_id === currentUserId;
  const isMissed = status === 'missed' || status === 'rejected' || (status === 'callee_busy');

  // Choose icon
  const getCallIcon = () => {
    if (isMissed) return <PhoneMissed size={16} className="text-white" />;
    if (call_type === 'video') return <Video size={16} className="text-white" />;
    return <Phone size={16} className="text-white" />;
  };

  // Icon background color
  const getIconBg = () => {
    if (isMissed) return 'bg-rose-500 shadow-rose-500/20';
    return isIncoming ? 'bg-slate-500 shadow-slate-500/20' : 'bg-emerald-500 shadow-emerald-500/20';
  };

  // Format description
  const getCallDescription = () => {
    const typeStr = call_type === 'video' ? 'Cuộc gọi video' : 'Cuộc gọi thoại';
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
    if (mins > 0) return `${mins}p ${secs}s`;
    return `${secs}s`;
  };

  const isOutgoing = !isIncoming;

  return (
    <div className={`flex w-full my-3.5 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      <div className={`group flex items-center gap-3.5 px-4 py-2.5 rounded-2xl shadow-sm border transition-all ${
        isMissed
          ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30'
          : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/60'
      } backdrop-blur-md max-w-sm`}>

        {/* Icon Circle */}
        <div className={`flex shrink-0 items-center justify-center w-9 h-9 rounded-full shadow-md ${getIconBg()}`}>
          {getCallIcon()}
        </div>

        {/* Text Info */}
        <div className="flex flex-col text-xs leading-tight">
          <p className={`font-semibold text-sm ${isMissed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
            {getCallDescription()}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-medium text-slate-600 dark:text-slate-300">{formatDuration()}</span>
            <span>•</span>
            <span title={new Date(created_at).toLocaleString('vi-VN')}>
              {dayjs(created_at).fromNow()}
            </span>
          </div>
        </div>

        {/* Quick Call Back Button */}
        {onCallBack && (
          <button
            onClick={onCallBack}
            className="ml-2 p-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors shadow-sm"
            title="Gọi lại"
          >
            {call_type === 'video' ? <Video size={15} /> : <Phone size={15} />}
          </button>
        )}

      </div>
    </div>
  );
};

export default CallHistoryItem;
