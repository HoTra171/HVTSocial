import { useState } from 'react';
import { LogOut, Settings, X, ChevronRight, User, Shield, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { disconnectSocket } from '../socket';
import toast from 'react-hot-toast';

const MobileSettingsMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const handleLogout = () => {
    try {
      disconnectSocket();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Đăng xuất thành công!');
      navigate('/');
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Đăng xuất thất bại');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] sm:hidden"
        onClick={onClose}
      />

      {/* Menu Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[101] sm:hidden animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Cài đặt</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar || user?.profile_picture || '/default.jpg'}
              alt={user?.full_name}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-200"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{user?.full_name}</h3>
              <p className="text-sm text-gray-500">@{user?.username}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-2">
          {/* Profile Settings */}
          <button
            onClick={() => {
              navigate('/profile');
              onClose();
            }}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Hồ sơ của bạn</p>
                <p className="text-xs text-gray-500">Xem và chỉnh sửa thông tin</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Change Password */}
          <button
            onClick={() => {
              navigate('/change-password');
              onClose();
            }}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Đổi mật khẩu</p>
                <p className="text-xs text-gray-500">Thay đổi mật khẩu của bạn</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Privacy Settings */}
          <button
            onClick={() => {
              navigate('/privacy-settings');
              onClose();
            }}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Quyền riêng tư</p>
                <p className="text-xs text-gray-500">Cài đặt bảo mật</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Logout Button */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition font-medium active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Safe Area Bottom Padding */}
        <div className="h-6" />
      </div>
    </>
  );
};

export default MobileSettingsMenu;
