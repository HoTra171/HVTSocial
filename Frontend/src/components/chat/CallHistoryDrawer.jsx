import React from 'react';
import { X, PhoneCall } from 'lucide-react';
import CallHistoryItem from '../CallHistoryItem';

export const CallHistoryDrawer = ({
  isOpen,
  onClose,
  historyList = [],
  myId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="w-72 sm:w-80 border-l border-gray-100 bg-white flex flex-col h-full flex-shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-16 px-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-sm text-gray-900">Lịch sử cuộc gọi</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {historyList.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            Chưa có lịch sử cuộc gọi nào
          </div>
        ) : (
          historyList.map((call) => (
            <CallHistoryItem key={call.id} call={call} myId={myId} />
          ))
        )}
      </div>
    </div>
  );
};

export default CallHistoryDrawer;
