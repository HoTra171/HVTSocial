import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Bookmark,
  Share2,
  Globe,
  Users,
  Lock,
  BadgeCheck,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const safeFromNow = (d) => {
  if (!d) return '';
  try {
    return dayjs(d).fromNow();
  } catch {
    return '';
  }
};

const pickAvatar = (u) => u?.profile_picture || u?.avatar || u?.photo || '/default.jpg';
const pickName = (u) => u?.full_name || u?.name || u?.username || 'Người dùng';

export const PostHeader = ({
  post,
  currentUser,
  isPostOwner,
  saved,
  onEdit,
  onDelete,
  onToggleSave,
  onCopyLink,
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const postUser = post?.user || {};
  const status = String(post?.status || post?.privacy || 'public').toLowerCase();

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const renderPrivacyIcon = () => {
    if (status === 'friends') {
      return <Users className="w-3.5 h-3.5 text-gray-400" title="Bạn bè" />;
    }
    if (status === 'private') {
      return <Lock className="w-3.5 h-3.5 text-gray-400" title="Chỉ mình tôi" />;
    }
    return <Globe className="w-3.5 h-3.5 text-gray-400" title="Công khai" />;
  };

  return (
    <div className="flex items-center justify-between p-4 pb-2">
      {/* Thông tin tác giả */}
      <div
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => postUser?.id && navigate(`/profile/${postUser.id}`)}
      >
        <div className="relative">
          <img
            src={pickAvatar(postUser)}
            alt={pickName(postUser)}
            className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm transition-transform group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/default.jpg';
            }}
          />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {pickName(postUser)}
            </h3>
            {postUser?.is_verified && (
              <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{safeFromNow(post?.created_at || post?.createdAt)}</span>
            <span>•</span>
            <span className="flex items-center">{renderPrivacyIcon()}</span>
          </div>
        </div>
      </div>

      {/* Menu tác vụ bài viết */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu((prev) => !prev)}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          title="Tùy chọn bài viết"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
            {/* Lưu bài viết */}
            <button
              onClick={() => {
                onToggleSave?.();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'text-indigo-600 fill-indigo-600' : ''}`} />
              <span>{saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}</span>
            </button>

            {/* Sao chép liên kết */}
            <button
              onClick={() => {
                onCopyLink?.();
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Sao chép liên kết</span>
            </button>

            {/* Chỉnh sửa / Xóa (nếu là chủ sở hữu) */}
            {isPostOwner && (
              <>
                <div className="h-px bg-slate-100 dark:bg-slate-700/80 my-1" />
                <button
                  onClick={() => {
                    onEdit?.();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-left transition-colors cursor-pointer"
                >
                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Chỉnh sửa bài viết</span>
                </button>
                <button
                  onClick={() => {
                    onDelete?.();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>Xóa bài viết</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostHeader;
