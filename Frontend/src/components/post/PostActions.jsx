import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, ThumbsUp } from 'lucide-react';

const REACTIONS = [
  { id: 'like', emoji: '👍', label: 'Thích', color: 'text-blue-600' },
  { id: 'love', emoji: '❤️', label: 'Yêu thích', color: 'text-rose-500' },
  { id: 'care', emoji: '🥰', label: 'Thương thương', color: 'text-amber-500' },
  { id: 'haha', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
  { id: 'wow', emoji: '😮', label: 'Wow', color: 'text-amber-500' },
  { id: 'sad', emoji: '😢', label: 'Buồn', color: 'text-indigo-400' },
  { id: 'angry', emoji: '😡', label: 'Phẫn nộ', color: 'text-orange-600' },
];

export const PostActions = ({
  liked,
  likesCount = 0,
  commentsCount = 0,
  sharesCount = 0,
  saved,
  onToggleLike,
  onShowLikesList,
  onToggleComments,
  onShare,
  onToggleSave,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(liked ? REACTIONS[1] : null);
  const timerRef = useRef(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setShowReactions(true);
    }, 250);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowReactions(false);
  };

  const handleSelectReaction = (reaction) => {
    setCurrentReaction(reaction);
    setShowReactions(false);
    if (!liked) {
      onToggleLike();
    }
  };

  const handleMainButtonClick = () => {
    if (liked) {
      setCurrentReaction(null);
      onToggleLike();
    } else {
      setCurrentReaction(REACTIONS[0]); // Mặc định Thích 👍
      onToggleLike();
    }
  };

  const activeReaction = liked ? currentReaction || REACTIONS[1] : null;

  return (
    <div className="px-4 py-2">
      {/* THỐNG KÊ LƯỢT TƯƠNG TÁC */}
      {(likesCount > 0 || commentsCount > 0 || sharesCount > 0) && (
        <div className="flex items-center justify-between text-xs text-gray-500 pb-2 mb-1 border-b border-gray-100 dark:border-slate-800">
          <div>
            {likesCount > 0 && (
              <button
                onClick={onShowLikesList}
                className="hover:underline text-gray-500 dark:text-slate-400 font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <div className="flex -space-x-1">
                  <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white ring-1 ring-white">
                    👍
                  </span>
                  <span className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[10px] text-white ring-1 ring-white">
                    ❤️
                  </span>
                </div>
                <span>{likesCount} người thích</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {commentsCount > 0 && (
              <button onClick={onToggleComments} className="hover:underline cursor-pointer">
                {commentsCount} bình luận
              </button>
            )}
            {sharesCount > 0 && <span>{sharesCount} chia sẻ</span>}
          </div>
        </div>
      )}

      {/* CÁC NÚT HÀNH ĐỘNG CHÍNH */}
      <div className="flex items-center justify-between pt-1 relative">
        {/* Nút Thích & Facebook Reactions Bar */}
        <div
          className="flex-1 relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Facebook Flying Reactions Popup */}
          {showReactions && (
            <div
              className="absolute -top-12 left-0 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 animate-fadeIn"
              style={{ animationDuration: '150ms' }}
            >
              {REACTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectReaction(r)}
                  className="text-2xl hover:scale-135 transform transition-transform duration-150 p-1 cursor-pointer active:scale-95"
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleMainButtonClick}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              liked
                ? activeReaction?.color || 'text-rose-500'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            {liked ? (
              <span className="text-base animate-bounce">{activeReaction?.emoji || '❤️'}</span>
            ) : (
              <Heart className="w-4 h-4 transition-transform active:scale-125" />
            )}
            <span>{liked ? activeReaction?.label || 'Đã thích' : 'Thích'}</span>
          </button>
        </div>

        {/* Nút Bình luận */}
        <button
          onClick={onToggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Bình luận</span>
        </button>

        {/* Nút Chia sẻ */}
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Chia sẻ</span>
        </button>

        {/* Nút Lưu bài viết */}
        <button
          onClick={onToggleSave}
          className={`p-2.5 rounded-xl transition-colors ${
            saved
              ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800'
          }`}
          title={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
        >
          <Bookmark className={`w-4.5 h-4.5 ${saved ? 'fill-indigo-600 dark:fill-indigo-400' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default PostActions;
