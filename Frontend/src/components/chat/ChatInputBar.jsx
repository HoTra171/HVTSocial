import React, { useRef } from 'react';
import { SendHorizonal, ImageIcon, X, CornerUpLeft } from 'lucide-react';

export const ChatInputBar = ({
  text = '',
  setText,
  onSendMessage,
  replyingTo,
  onCancelReply,
  previewImages = [],
  onRemovePreviewImage,
  onSelectImages,
  disabled = false,
}) => {
  const fileInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onSelectImages?.(files);
    }
    e.target.value = '';
  };

  const hasContent = text.trim().length > 0 || previewImages.length > 0;

  return (
    <div className="border-t border-gray-100 bg-white p-3 flex-shrink-0">
      {/* THANH ĐANG TRẢ LỜI TIN NHẮN */}
      {replyingTo && (
        <div className="mb-2 px-3 py-1.5 bg-gray-50 border-l-4 border-indigo-600 rounded-r-lg flex items-center justify-between animate-in fade-in duration-100">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <div className="text-xs min-w-0">
              <span className="font-semibold text-gray-700">
                Đang trả lời {replyingTo.sender_name || 'tin nhắn'}:
              </span>
              <p className="text-gray-500 truncate max-w-xs sm:max-w-md">
                {replyingTo.message || replyingTo.content || '[Tệp đính kèm]'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* THANH XEM TRƯỚC ẢNH CHUẨN BỊ GỬI */}
      {previewImages.length > 0 && (
        <div className="mb-2 flex items-center gap-2 overflow-x-auto py-1">
          {previewImages.map((img, i) => (
            <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 group">
              <img
                src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onRemovePreviewImage?.(i)}
                className="absolute top-0.5 right-0.5 bg-black/60 text-white p-0.5 rounded-full hover:bg-black/80"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* THANH NHẬP CHÍNH */}
      <div className="flex items-center gap-2">
        {/* Nút đính kèm ảnh */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex-shrink-0"
          title="Gửi hình ảnh"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Ô nhập text */}
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            disabled={disabled}
            className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Nút gửi tin nhắn */}
        <button
          type="button"
          onClick={onSendMessage}
          disabled={!hasContent || disabled}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-full shadow-md transition-all flex-shrink-0 active:scale-95"
          title="Gửi"
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatInputBar;
