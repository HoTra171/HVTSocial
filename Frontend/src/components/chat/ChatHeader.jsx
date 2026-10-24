import React from 'react';
import { ArrowLeft, Phone, Video, History, Info, Users } from 'lucide-react';
import { getFullImageUrl, handleImageError } from '../../utils/imageHelper';

export const ChatHeader = ({
  partner,
  isPartnerOnline = false,
  isPartnerTyping = false,
  onStartVoiceCall,
  onStartVideoCall,
  onToggleCallHistory,
  showCallHistory = false,
  onBack,
  onOpenGroupInfo,
}) => {
  const isGroup = Boolean(partner?.is_group_chat);
  const partnerName = partner?.name || partner?.full_name || partner?.username || 'Đoạn chat';
  const partnerAvatar = partner?.avatar || partner?.profile_picture;

  return (
    <div className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0 z-10 shadow-xs transition-colors">
      {/* Thông tin đối phương hoặc nhóm */}
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full md:hidden transition-colors"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative flex-shrink-0">
          {isGroup ? (
            partnerAvatar ? (
              <img
                src={getFullImageUrl(partnerAvatar)}
                alt={partnerName}
                onError={handleImageError}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-xs">
                <Users size={18} />
              </div>
            )
          ) : (
            <img
              src={getFullImageUrl(partnerAvatar)}
              alt={partnerName}
              onError={handleImageError}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
          )}

          {!isGroup && isPartnerOnline && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
              title="Đang hoạt động"
            />
          )}
        </div>

        <div className="min-w-0 cursor-pointer" onClick={isGroup ? onOpenGroupInfo : undefined}>
          <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
            {partnerName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {isGroup ? (
              <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                <Users size={11} /> Nhóm trò chuyện • Nhấn để xem thông tin
              </span>
            ) : isPartnerTyping ? (
              <span className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                Đang nhập tin nhắn...
              </span>
            ) : isPartnerOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Đang hoạt động</span>
            ) : (
              'Ngoại tuyến'
            )}
          </p>
        </div>
      </div>

      {/* Các nút gọi thoại & video call hoặc nút Nhóm */}
      <div className="flex items-center gap-1 sm:gap-2">
        {!isGroup && onStartVoiceCall && (
          <button
            onClick={onStartVoiceCall}
            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Gọi thoại"
          >
            <Phone className="w-5 h-5" />
          </button>
        )}

        {!isGroup && onStartVideoCall && (
          <button
            onClick={onStartVideoCall}
            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Gọi video"
          >
            <Video className="w-5 h-5" />
          </button>
        )}

        {!isGroup && onToggleCallHistory && (
          <button
            onClick={onToggleCallHistory}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showCallHistory
                ? 'text-indigo-600 bg-indigo-50 dark:bg-slate-800'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Lịch sử cuộc gọi"
          >
            <History className="w-5 h-5" />
          </button>
        )}

        {isGroup && onOpenGroupInfo && (
          <button
            onClick={onOpenGroupInfo}
            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            title="Thông tin nhóm"
          >
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
