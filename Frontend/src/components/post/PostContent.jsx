import React, { useState, useMemo } from 'react';

export const PostContent = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const text = content || '';
  const isLong = text.length > 250;

  const displayContent = useMemo(() => {
    const raw = isLong && !isExpanded ? `${text.slice(0, 250)}...` : text;
    // Highlight hashtags
    return raw.replace(
      /#(\w+)/g,
      '<span class="text-indigo-600 font-medium hover:underline cursor-pointer">#$1</span>'
    );
  }, [text, isLong, isExpanded]);

  if (!text) return null;

  return (
    <div className="px-4 py-2">
      <div
        className="text-sm text-gray-800 leading-relaxed whitespace-pre-line break-words"
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
      {isLong && (
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-1 focus:outline-none"
        >
          {isExpanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
};

export default PostContent;
