import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const MessageSearch = ({ messages, onResultClick, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Search messages
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results = messages.filter((msg) => {
      // Search in message content
      if (msg.content && msg.content.toLowerCase().includes(query)) {
        return true;
      }
      // Search in replied message
      if (msg.reply_to_content && msg.reply_to_content.toLowerCase().includes(query)) {
        return true;
      }
      return false;
    }).reverse(); // Latest first

    setSearchResults(results);
    setCurrentIndex(0);
  }, [searchQuery, messages]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      onResultClick(searchResults[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < searchResults.length - 1) {
      setCurrentIndex(currentIndex + 1);
      onResultClick(searchResults[currentIndex + 1].id);
    }
  };

  const handleResultClick = (msg) => {
    onResultClick(msg.id);
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-yellow-300 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Search Input */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tin nhắn..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Search Results Counter & Navigation */}
      {searchQuery && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {searchResults.length > 0
              ? `${currentIndex + 1}/${searchResults.length} kết quả`
              : 'Không tìm thấy kết quả'}
          </p>
          {searchResults.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === searchResults.length - 1}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search Results List (Optional - show first few results) */}
      {searchQuery && searchResults.length > 0 && (
        <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
          {searchResults.slice(0, 5).map((msg, index) => (
            <div
              key={msg.id}
              onClick={() => handleResultClick(msg)}
              className={`p-2 rounded-lg cursor-pointer transition ${
                index === currentIndex
                  ? 'bg-blue-50 border border-blue-300'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <p className="text-sm text-gray-800 line-clamp-2">
                {highlightText(msg.content || '', searchQuery)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {msg.sender_name} • {new Date(msg.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          ))}
          {searchResults.length > 5 && (
            <p className="text-xs text-gray-500 text-center py-2">
              +{searchResults.length - 5} kết quả khác
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageSearch;
