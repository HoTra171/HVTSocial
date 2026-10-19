import React from 'react';
import { ArrowLeft, Phone, Video, History } from 'lucide-react';
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
}) => {
  const partnerName = partner?.full_name || partner?.username || 'Người dùng';
  const partnerAvatar = getFullImageUrl(partner?.profile_picture || partner?.avatar);

  return (
    <div className="h-16 px-4 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
      {/* Thông tin đối phương */}
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-gray-600 hover:bg-gray-100 rounded-full md:hidden transition-colors"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative flex-shrink-0">
          <img
            src={partnerAvatar}
            alt={partnerName}
            onError={handleImageError}
            className="w-10 h-10 rounded-full object-cover border border-gray-100"
          />
          {isPartnerOnline && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
              title="Đang hoạt động"
            />
          )}
        </div>

        <div className="min-w-0">
          <h2 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
            {partnerName}
          </h2>
          <p className="text-xs text-gray-500 truncate">
            {isPartnerTyping ? (
              <span className="text-indigo-600 font-medium animate-pulse">
                Đang nhập tin nhắn...
              </span>
            ) : isPartnerOnline ? (
              <span className="text-green-600 font-medium">Đang hoạt động</span>
            ) : (
              'Ngoại tuyến'
            )}
          </p>
        </div>
      </div>

      {/* Các nút gọi thoại & video call */}
      <div className="flex items-center gap-1 sm:gap-2">
        {onStartVoiceCall && (
          <button
            onClick={onStartVoiceCall}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Gọi thoại"
          >
            <Phone className="w-5 h-5" />
          </button>
        )}

        {onStartVideoCall && (
          <button
            onClick={onStartVideoCall}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Gọi video"
          >
            <Video className="w-5 h-5" />
          </button>
        )}

        {onToggleCallHistory && (
          <button
            onClick={onToggleCallHistory}
            className={`p-2 rounded-full transition-colors ${
              showCallHistory
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Lịch sử cuộc gọi"
          >
            <History className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
