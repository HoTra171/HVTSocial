import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  MapPin,
  Calendar,
  User,
  AtSign,
  Sparkles,
  Shield,
  Loader2,
  Trash2,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '../api/userApi';
import { useAuth } from '../contexts/AuthContext';

const GENDERS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Công khai', desc: 'Mọi người trên mạng xã hội đều xem được' },
  { value: 'friends', label: 'Bạn bè', desc: 'Chỉ bạn bè mới có thể xem thông tin chi tiết' },
  { value: 'private', label: 'Riêng tư', desc: 'Chỉ mình bạn xem được thông tin cá nhân' },
];

const ProfileModal = ({ setShowEdit, user, setUser }) => {
  const { currentUser, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'media' | 'privacy'

  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    address: user?.address || user?.location || '',
    gender: user?.gender || '',
    date_of_birth: user?.date_of_birth
      ? new Date(user.date_of_birth).toISOString().split('T')[0]
      : '',
    profile_visibility: user?.profile_visibility || 'public',
    avatar: null,
    background: null,
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [backgroundPreview, setBackgroundPreview] = useState(user?.background || user?.cover_photo || '');
  const [loading, setLoading] = useState(false);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (backgroundPreview && backgroundPreview.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundPreview);
      }
    };
  }, [avatarPreview, backgroundPreview]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ảnh đại diện không được vượt quá 10MB');
        return;
      }
      setEditForm((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBackgroundChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ảnh bìa không được vượt quá 10MB');
        return;
      }
      setEditForm((prev) => ({ ...prev, background: file }));
      setBackgroundPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    const targetId = user?.id || currentUser?.id;
    if (!targetId) {
      toast.error('Không tìm thấy ID người dùng');
      return;
    }

    if (!editForm.full_name.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('full_name', editForm.full_name.trim());
      formData.append('username', editForm.username.trim());
      formData.append('bio', editForm.bio.trim());
      formData.append('address', editForm.address.trim());
      if (editForm.gender) formData.append('gender', editForm.gender);
      if (editForm.date_of_birth) formData.append('date_of_birth', editForm.date_of_birth);

      if (editForm.avatar) {
        formData.append('avatar', editForm.avatar);
      }
      if (editForm.background) {
        formData.append('background', editForm.background);
      }

      // Update basic profile
      const res = await userApi.updateProfile(targetId, formData);

      // If privacy visibility changed, also sync with privacy API
      if (editForm.profile_visibility && editForm.profile_visibility !== user?.profile_visibility) {
        await userApi
          .updatePrivacySettings({ profile_visibility: editForm.profile_visibility })
          .catch(() => {});
      }

      if (res.data?.success || res.status === 200) {
        const updated = res.data?.user || res.data?.data || {};

        const fullUpdated = {
          ...user,
          ...updated,
          full_name: editForm.full_name,
          username: editForm.username,
          bio: editForm.bio,
          address: editForm.address,
          gender: editForm.gender,
          date_of_birth: editForm.date_of_birth,
          profile_visibility: editForm.profile_visibility,
          avatar: updated.avatar || avatarPreview,
          background: updated.background || backgroundPreview,
        };

        // Update local user state
        setUser?.(fullUpdated);

        // Update global auth context and localStorage
        updateUser(fullUpdated);

        toast.success('Cập nhật thông tin cá nhân thành công!');
        setShowEdit(false);
      } else {
        toast.error(res.data?.message || 'Cập nhật thất bại');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật hồ sơ, vui lòng thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => setShowEdit(false)}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Chỉnh sửa trang cá nhân</span>
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật thông tin chi tiết và tùy chỉnh diện mạo hồ sơ của bạn
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowEdit(false)}
            disabled={loading}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-100 px-6 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Thông tin cơ bản
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'media'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Ảnh đại diện & Ảnh bìa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Quyền riêng tư
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Full name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder="Nhập họ và tên đầy đủ"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tên người dùng (Username)
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                      })
                    }
                    placeholder="username"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Đường dẫn hồ sơ của bạn: <span className="font-mono text-indigo-500">/profile/{user?.id}</span>
                </p>
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Tiểu sử (Bio)
                  </label>
                  <span
                    className={`text-xs ${
                      editForm.bio.length > 160 ? 'text-red-500 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {editForm.bio.length}/160
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Viết vài dòng giới thiệu bản thân, sở thích hoặc châm ngôn sống của bạn..."
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                />
              </div>

              {/* Grid 2 cols: Gender & Date of birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Giới tính
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {GENDERS.map((g) => {
                      const isSelected = editForm.gender === g.value;
                      return (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, gender: g.value })}
                          className={`py-2 px-3 text-xs font-medium rounded-xl border transition cursor-pointer text-center ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Ngày sinh
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nơi sống / Địa chỉ
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    placeholder="Ví dụ: TP. Hồ Chí Minh, Việt Nam"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDIA (AVATAR & COVER) */}
          {activeTab === 'media' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Cover Photo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Ảnh bìa (Cover Photo)
                  </label>
                  {editForm.background && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({ ...editForm, background: null });
                        setBackgroundPreview(user?.background || user?.cover_photo || '');
                      }}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hủy chọn</span>
                    </button>
                  )}
                </div>

                <div className="relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-100 group">
                  {backgroundPreview ? (
                    <img
                      src={backgroundPreview}
                      alt="Cover Preview"
                      className="w-full h-full object-cover group-hover:brightness-90 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center text-white/80" />
                  )}

                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                    <Camera className="w-8 h-8 mb-1 drop-shadow" />
                    <span className="text-xs font-semibold drop-shadow">Thay đổi ảnh bìa</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundChange}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Khuyến nghị ảnh tỉ lệ 3:1 (1200x400px), định dạng JPG, PNG hoặc WEBP, tối đa 10MB.
                </p>
              </div>

              {/* Avatar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Ảnh đại diện (Avatar)
                  </label>
                  {editForm.avatar && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditForm({ ...editForm, avatar: null });
                        setAvatarPreview(user?.avatar || '');
                      }}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hủy chọn</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 group flex-shrink-0">
                    <img
                      src={avatarPreview || '/default.jpg'}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover group-hover:brightness-90 transition duration-300"
                    />
                    <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                      <Camera className="w-6 h-6 mb-0.5 drop-shadow" />
                      <span className="text-[10px] font-semibold drop-shadow">Chọn ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer border border-indigo-200">
                      <Camera className="w-4 h-4" />
                      <span>Tải ảnh mới</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      Ảnh vuông hiển thị tốt nhất (400x400px trở lên).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY SETTINGS */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 leading-relaxed">
                  <span className="font-semibold block mb-0.5">Quyền xem hồ sơ</span>
                  Cài đặt này xác định ai có thể xem chi tiết thông tin hồ sơ và bài viết của bạn.
                </div>
              </div>

              <div className="space-y-2.5">
                {PRIVACY_OPTIONS.map((opt) => {
                  const isSelected = editForm.profile_visibility === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setEditForm({ ...editForm, profile_visibility: opt.value })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{opt.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition text-white shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;