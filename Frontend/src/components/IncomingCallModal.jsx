import { Phone, Video, X } from 'lucide-react';

const IncomingCallModal = ({ caller, isVideoCall, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center animate-pulse-slow">
        {/* Avatar */}
        <div className="mb-6">
          <img
            src={caller.avatar || `/default.jpg`}
            alt={caller.name}
            className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-indigo-500 shadow-lg"
          />
        </div>

        {/* Caller Name */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {caller.name}
        </h2>

        {/* Call Type */}
        <div className="flex items-center justify-center gap-2 text-gray-600 mb-8">
          {isVideoCall ? (
            <>
              <Video className="w-5 h-5" />
              <span>Cuộc gọi video đến...</span>
            </>
          ) : (
            <>
              <Phone className="w-5 h-5" />
              <span>Cuộc gọi thoại đến...</span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject */}
          <button
            onClick={onReject}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Accept */}
          <button
            onClick={onAccept}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 animate-bounce"
          >
            {isVideoCall ? (
              <Video className="w-8 h-8" />
            ) : (
              <Phone className="w-8 h-8" />
            )}
          </button>
        </div>

        {/* Ringtone animation */}
        <div className="mt-6 flex justify-center gap-1">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;