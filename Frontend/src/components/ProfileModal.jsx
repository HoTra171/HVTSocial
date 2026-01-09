import React, { useState } from 'react';
import { Pencil, X, Loader } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL, SERVER_ORIGIN } from '../constants/api';

const ProfileModal = ({ setShowEdit, user, setUser }) => {
  const [editForm, setEditForm] = useState({
    full_name: user.full_name || '',
    username: user.username || '',
    bio: user.bio || '',
    address: user.address || '',
    avatar: null,
    background: null,
  });

  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [backgroundPreview, setBackgroundPreview] = useState(user.background);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm({ ...editForm, avatar: file });
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBackgroundChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditForm({ ...editForm, background: file });
      setBackgroundPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const startTime = Date.now();

      const formData = new FormData();
      formData.append('full_name', editForm.full_name);
      formData.append('username', editForm.username);
      formData.append('bio', editForm.bio);
      formData.append('address', editForm.address);

      if (editForm.avatar) {
        formData.append('avatar', editForm.avatar);
      }

      if (editForm.background) {
        formData.append('background', editForm.background);
      }

      const token = localStorage.getItem('token');
      const url = `${API_URL}/users/${user.id}`;

      const res = await axios.put(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data',
        },
      });

      const elapsed = Date.now() - startTime;
      console.log(`⚡ Update completed in ${elapsed}ms`);

      if (res.data.success && res.data.user) {
        // UPDATE STATE TRỰC TIẾP (không reload)
        // setUser(res.data.user);

        // UPDATE LOCALSTORAGE
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = { ...currentUser, ...res.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // toast.success(`Cập nhật thành công! (${elapsed}ms)`);

        // ĐÓNG MODAL NGAY (không reload)
        setShowEdit(false);
        window.location.reload();

      } else {
        toast.error(res.data.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error('Update error:', err);
      toast.error(
        err.response?.data?.message ||
        'Không thể cập nhật profile'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa hồ sơ</h1>
            <button
              onClick={() => setShowEdit(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSaveProfile}>
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh đại diện
              </label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={loading}
                />
                <div className="relative w-24 h-24 group">
                  <img
                    src={
                      avatarPreview ||
                      `/default.jpg`
                    }

                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50 rounded-full">
                    <Pencil className="text-white w-6 h-6" />
                  </div>
                </div>
              </label>
              {editForm.avatar && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {editForm.avatar.name}
                </p>
              )}
            </div>

            {/* Cover Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh bìa
              </label>
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundChange}
                  className="hidden"
                  disabled={loading}
                />
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-gray-100 group">
                  <img
                    src={backgroundPreview || '/default-background.jpg'}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/30">
                    <Pencil className="text-white w-8 h-8" />
                  </div>
                </div>
              </label>
              {editForm.background && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ {editForm.background.name}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm({ ...editForm, full_name: e.target.value })
                }
                disabled={loading}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên người dùng
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={editForm.username}
                onChange={(e) =>
                  setEditForm({ ...editForm, username: e.target.value })
                }
                disabled={loading}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiểu sử
              </label>
              <textarea
                rows={3}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                disabled={loading}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ
              </label>
              <input
                type="text"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                disabled={loading}
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;