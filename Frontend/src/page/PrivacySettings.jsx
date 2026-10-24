import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Eye,
  Globe,
  Users,
  Lock,
  UserPlus,
  Radio,
  Check,
  Loader2,
  KeyRound,
  ShieldAlert,
  Info,
  Sparkles,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userApi } from '../api/userApi';

const PrivacySettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  const [settings, setSettings] = useState({
    profile_visibility: 'public', // 'public' | 'friends' | 'private'
    post_visibility: 'public', // 'public' | 'friends'
    allow_friend_requests: true,
    show_online_status: true,
  });

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Vui lòng đăng nhập để cấu hình quyền riêng tư');
        navigate('/login');
        return;
      }

      const res = await userApi.getPrivacySettings();
      if (res.data) {
        setSettings({
          profile_visibility: res.data.profile_visibility || 'public',
          post_visibility: res.data.post_visibility || 'public',
          allow_friend_requests: res.data.allow_friend_requests ?? true,
          show_online_status: res.data.show_online_status ?? true,
        });
        localStorage.setItem('privacySettings', JSON.stringify(res.data));
      }
    } catch (error) {
      console.error('Fetch privacy settings error:', error);
      // Fallback to localStorage
      const savedSettings = localStorage.getItem('privacySettings');
      if (savedSettings) {
        try {
          setSettings((prev) => ({ ...prev, ...JSON.parse(savedSettings) }));
        } catch (e) {
          console.error('Parse privacy settings error:', e);
        }
      }
    } finally {
      setInitialLoading(false);
    }
  };

  const updatePrivacySetting = async (key, value) => {
    try {
      setLoading(true);
      setSaveStatus('saving');

      // Optimistic update
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      // Save to backend via userApi
      await userApi.updatePrivacySettings({ [key]: value });

      // Save to localStorage
      localStorage.setItem('privacySettings', JSON.stringify(newSettings));

      setSaveStatus('saved');
      toast.success('Đã cập nhật cài đặt quyền riêng tư');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2500);
    } catch (error) {
      console.error('Update privacy settings error:', error);
      toast.error('Không thể cập nhật cài đặt, vui lòng thử lại');
      setSaveStatus('idle');
      // Rollback by refetching
      fetchPrivacySettings();
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Đang tải cài đặt quyền riêng tư...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 sm:py-10 px-3 sm:px-6 transition-colors">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* TOP BAR / HEADER */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs transition cursor-pointer"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Quyền riêng tư
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Quản lý ai có thể xem thông tin, bài viết và tương tác với bạn
              </p>
            </div>
          </div>

          {/* STATUS INDICATOR BADGE */}
          <div className="hidden sm:flex items-center">
            {saveStatus === 'saving' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Đã lưu tự động</span>
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bảo vệ quyền riêng tư</span>
              </span>
            )}
          </div>
        </div>

        {/* SECTION 1: PROFILE VISIBILITY (HIỂN THỊ HỒ SƠ) */}
        <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md transition-all">
          <div className="flex items-start gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Hiển thị trang cá nhân
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Kiểm soát ai có thể xem chi tiết hồ sơ cá nhân và danh sách thông tin của bạn
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* CÔNG KHAI */}
            <div
              onClick={() => updatePrivacySetting('profile_visibility', 'public')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between relative group ${
                settings.profile_visibility === 'public'
                  ? 'bg-gradient-to-br from-indigo-50/80 to-purple-50/40 dark:from-indigo-950/40 dark:to-purple-950/20 border-indigo-600 dark:border-indigo-500 shadow-sm'
                  : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                    settings.profile_visibility === 'public'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  {settings.profile_visibility === 'public' && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Công khai</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Bất kỳ ai trên HVTSocial đều có thể xem trang cá nhân của bạn.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Khuyên dùng</span>
              </div>
            </div>

            {/* BẠN BÈ */}
            <div
              onClick={() => updatePrivacySetting('profile_visibility', 'friends')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between relative group ${
                settings.profile_visibility === 'friends'
                  ? 'bg-gradient-to-br from-indigo-50/80 to-purple-50/40 dark:from-indigo-950/40 dark:to-purple-950/20 border-indigo-600 dark:border-indigo-500 shadow-sm'
                  : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                    settings.profile_visibility === 'friends'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <Users className="w-4 h-4" />
                  </div>
                  {settings.profile_visibility === 'friends' && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Bạn bè</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Chỉ những người trong danh sách bạn bè mới xem được trang cá nhân.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Riêng tư vừa phải</span>
              </div>
            </div>

            {/* RIÊNG TƯ / KHÓA HỒ SƠ */}
            <div
              onClick={() => updatePrivacySetting('profile_visibility', 'private')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between relative group ${
                settings.profile_visibility === 'private'
                  ? 'bg-gradient-to-br from-indigo-50/80 to-purple-50/40 dark:from-indigo-950/40 dark:to-purple-950/20 border-indigo-600 dark:border-indigo-500 shadow-sm'
                  : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                    settings.profile_visibility === 'private'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    <Lock className="w-4 h-4" />
                  </div>
                  {settings.profile_visibility === 'private' && (
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Riêng tư</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Chỉ mình bạn. Người khác sẽ thấy thông báo hồ sơ đang ở chế độ khóa.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>Bảo mật tối đa</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: POST VISIBILITY (HIỂN THỊ BÀI VIẾT MẶC ĐỊNH) */}
        <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md transition-all">
          <div className="flex items-start gap-3.5 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Đối tượng bài viết mặc định
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Thiết lập quyền riêng tư được chọn sẵn mỗi khi bạn đăng bài viết mới lên Bảng tin
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* CÔNG KHAI */}
            <div
              onClick={() => updatePrivacySetting('post_visibility', 'public')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                settings.post_visibility === 'public'
                  ? 'bg-gradient-to-r from-purple-50/80 via-white to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border-purple-600 dark:border-purple-500 shadow-sm'
                  : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  settings.post_visibility === 'public'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Công khai (Mọi người)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bài viết xuất hiện trên Bảng tin công khai
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                settings.post_visibility === 'public'
                  ? 'border-purple-600 bg-purple-600 text-white'
                  : 'border-slate-300 dark:border-slate-700 bg-transparent'
              }`}>
                {settings.post_visibility === 'public' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            {/* BẠN BÈ */}
            <div
              onClick={() => updatePrivacySetting('post_visibility', 'friends')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                settings.post_visibility === 'friends'
                  ? 'bg-gradient-to-r from-purple-50/80 via-white to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border-purple-600 dark:border-purple-500 shadow-sm'
                  : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                  settings.post_visibility === 'friends'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Chỉ bạn bè</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Chỉ bạn bè mới có thể nhìn thấy bài viết
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                settings.post_visibility === 'friends'
                  ? 'border-purple-600 bg-purple-600 text-white'
                  : 'border-slate-300 dark:border-slate-700 bg-transparent'
              }`}>
                {settings.post_visibility === 'friends' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: INTERACTIONS & STATUS TOGGLES */}
        <section className="bg-white dark:bg-slate-900/90 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md transition-all divide-y divide-slate-100 dark:divide-slate-800/80">
          {/* LỜI MỜI KẾT BẠN */}
          <div className="pb-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  Nhận lời mời kết bạn
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Cho phép các thành viên khác trên mạng xã hội tìm thấy và gửi lời mời kết bạn đến bạn.
                </p>
              </div>
            </div>

            {/* MODERN TOGGLE SWITCH */}
            <button
              type="button"
              role="switch"
              aria-checked={settings.allow_friend_requests}
              onClick={() => updatePrivacySetting('allow_friend_requests', !settings.allow_friend_requests)}
              disabled={loading}
              className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                settings.allow_friend_requests ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.allow_friend_requests ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* TRẠNG THÁI TRỰC TUYẾN */}
          <div className="pt-5 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 shadow-sm relative">
                <Activity className="w-5 h-5" />
                {settings.show_online_status && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Trạng thái hoạt động (Online)</span>
                  {settings.show_online_status && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                      Đang bật
                    </span>
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Hiển thị chấm xanh khi bạn đang truy cập HVTSocial để bạn bè biết khi nào bạn sẵn sàng trò chuyện.
                </p>
              </div>
            </div>

            {/* MODERN TOGGLE SWITCH */}
            <button
              type="button"
              role="switch"
              aria-checked={settings.show_online_status}
              onClick={() => updatePrivacySetting('show_online_status', !settings.show_online_status)}
              disabled={loading}
              className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${
                settings.show_online_status ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.show_online_status ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* SECTION 4: SECURITY SHORTCUTS & TIPS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* LỐI TẮT ĐỔI MẬT KHẨU */}
          <Link
            to="/change-password"
            className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Đổi mật khẩu tài khoản
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cập nhật mật khẩu định kỳ để nâng cao an toàn
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </Link>

          {/* LƯU Ý BẢO MẬT */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-500/20 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">
                Bảo vệ tài khoản đa tầng
              </h4>
              <p className="text-xs text-indigo-100/90 mt-0.5 leading-relaxed">
                Không chia sẻ mã xác thực hoặc mật khẩu của bạn cho bất kỳ ai.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
