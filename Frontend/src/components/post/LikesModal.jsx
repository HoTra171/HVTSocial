import React, { useEffect, useState } from 'react';
import { X, Heart, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { postApi } from '../../api/postApi';

const pickAvatar = (u) => u?.profile_picture || u?.avatar || u?.photo || '/default.jpg';
const pickName = (u) => u?.full_name || u?.name || u?.username || 'Người dùng';

export const LikesModal = ({ isOpen, onClose, postId }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !postId) return;

    let mounted = true;
    setLoading(true);

    postApi
      .getLikingUsers(postId)
      .then((res) => {
        if (mounted) {
          setUsers(res.data?.data || res.data?.users || res.data || []);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh sách người thích bài:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, postId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
              <Heart className="w-3.5 h-3.5 fill-white" />
            </span>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
              Người đã thích bài viết
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Đang tải danh sách...
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Chưa có lượt thích nào
            </div>
          ) : (
            users.map((u, i) => (
              <div
                key={u.id || i}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                onClick={() => {
                  onClose();
                  navigate(`/profile/${u.id}`);
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={pickAvatar(u)}
                    alt={pickName(u)}
                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                    onError={(e) => {
                      e.currentTarget.src = '/default.jpg';
                    }}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {pickName(u)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{u.username || 'user'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LikesModal;
