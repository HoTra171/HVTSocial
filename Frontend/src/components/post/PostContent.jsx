import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export const PostContent = ({ content }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const text = content || '';
  const isLong = text.length > 280;

  const rawText = isLong && !isExpanded ? `${text.slice(0, 280)}...` : text;

  // Tách text thành các token: text thường, #hashtag, @mention
  const renderedContent = useMemo(() => {
    if (!rawText) return null;

    // Regex tìm kiếm hashtag (#word) và mention (@word) hỗ trợ tiếng Việt
    const tokenRegex = /(#[a-zA-Z0-9_\u00C0-\u1EF9]+|@[a-zA-Z0-9_.-]+)/g;
    const parts = rawText.split(tokenRegex);

    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/discover?q=${encodeURIComponent(part)}`);
            }}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer transition-colors"
            title={`Tìm kiếm bài viết với thẻ ${part}`}
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/discover?q=${encodeURIComponent(username)}`);
            }}
            className="text-purple-600 dark:text-purple-400 font-semibold hover:underline cursor-pointer transition-colors"
            title={`Xem trang của @${username}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }, [rawText, navigate]);

  if (!text) return null;

  return (
    <div className="px-4 py-2">
      <div className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line break-words">
        {renderedContent}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1 focus:outline-none cursor-pointer"
        >
          {isExpanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
};

export default PostContent;
