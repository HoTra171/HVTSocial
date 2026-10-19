import React from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';

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
  return (
    <div className="px-4 py-2">
      {/* THỐNG KÊ LƯỢT TƯƠNG TÁC */}
      {(likesCount > 0 || commentsCount > 0 || sharesCount > 0) && (
        <div className="flex items-center justify-between text-xs text-gray-500 pb-2 mb-1 border-b border-gray-100">
          <div>
            {likesCount > 0 && (
              <button
                onClick={onShowLikesList}
                className="hover:underline text-gray-500 font-medium flex items-center gap-1.5"
              >
                <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <Heart className="w-2.5 h-2.5 fill-white" />
                </span>
                <span>{likesCount} người thích</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {commentsCount > 0 && (
              <button onClick={onToggleComments} className="hover:underline">
                {commentsCount} bình luận
              </button>
            )}
            {sharesCount > 0 && <span>{sharesCount} chia sẻ</span>}
          </div>
        </div>
      )}

      {/* CÁC NÚT HÀNH ĐỘNG CHÍNH */}
      <div className="flex items-center justify-between pt-1">
        {/* Nút Thích */}
        <button
          onClick={onToggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            liked
              ? 'text-red-500 hover:bg-red-50'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform active:scale-125 ${
              liked ? 'fill-red-500 text-red-500 scale-110' : ''
            }`}
          />
          <span>Thích</span>
        </button>

        {/* Nút Bình luận */}
        <button
          onClick={onToggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Bình luận</span>
        </button>

        {/* Nút Chia sẻ */}
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Chia sẻ</span>
        </button>

        {/* Nút Lưu bài viết */}
        <button
          onClick={onToggleSave}
          className={`p-2 rounded-lg transition-colors ${
            saved
              ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-indigo-600' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default PostActions;
