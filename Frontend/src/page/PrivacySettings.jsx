import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Eye, EyeOff, Lock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PrivacySettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    profile_visibility: 'public', // public, friends, private
    post_visibility: 'public', // public, friends
    allow_friend_requests: true,
    show_online_status: true,
  });

  useEffect(() => {
    // Load settings from localStorage (fallback until backend API is ready)
    const savedSettings = localStorage.getItem('privacySettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Parse privacy settings error:', e);
      }
    }
  }, []);

  const updatePrivacySetting = async (key, value) => {
    try {
      setLoading(true);

      // Update state
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      // Save to localStorage (temporary until backend API is ready)
      localStorage.setItem('privacySettings', JSON.stringify(newSettings));

      toast.success('Đã cập nhật cài đặt quyền riêng tư');

      // TODO: Uncomment when backend API is ready
      // const token = localStorage.getItem('token');
      // if (token) {
      //   await axios.put(
      //     `${API_URL}/users/privacy-settings`,
      //     { [key]: value },
      //     { headers: { Authorization: `Bearer ${token}` } }
      //   );
      // }
    } catch (error) {
      console.error('Update privacy settings error:', error);
      toast.error('Không thể cập nhật cài đặt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Quyền riêng tư</h1>
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Profile Visibility */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Hiển thị hồ sơ
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Ai có thể xem hồ sơ của bạn
                </p>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="profile_visibility"
                      value="public"
                      checked={settings.profile_visibility === 'public'}
                      onChange={(e) =>
                        updatePrivacySetting('profile_visibility', e.target.value)
                      }
                      className="w-4 h-4 text-indigo-600"
                      disabled={loading}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Công khai</p>
                      <p className="text-xs text-gray-500">
                        Mọi người có thể xem hồ sơ của bạn
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="profile_visibility"
                      value="friends"
                      checked={settings.profile_visibility === 'friends'}
                      onChange={(e) =>
                        updatePrivacySetting('profile_visibility', e.target.value)
                      }
                      className="w-4 h-4 text-indigo-600"
                      disabled={loading}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Bạn bè</p>
                      <p className="text-xs text-gray-500">
                        Chỉ bạn bè có thể xem hồ sơ
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="profile_visibility"
                      value="private"
                      checked={settings.profile_visibility === 'private'}
                      onChange={(e) =>
                        updatePrivacySetting('profile_visibility', e.target.value)
                      }
                      className="w-4 h-4 text-indigo-600"
                      disabled={loading}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Riêng tư</p>
                      <p className="text-xs text-gray-500">
                        Chỉ bạn có thể xem hồ sơ
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Post Visibility */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Hiển thị bài viết
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Ai có thể xem bài viết của bạn
                </p>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="post_visibility"
                      value="public"
                      checked={settings.post_visibility === 'public'}
                      onChange={(e) =>
                        updatePrivacySetting('post_visibility', e.target.value)
                      }
                      className="w-4 h-4 text-indigo-600"
                      disabled={loading}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Công khai</p>
                      <p className="text-xs text-gray-500">
                        Mọi người có thể xem bài viết
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="post_visibility"
                      value="friends"
                      checked={settings.post_visibility === 'friends'}
                      onChange={(e) =>
                        updatePrivacySetting('post_visibility', e.target.value)
                      }
                      className="w-4 h-4 text-indigo-600"
                      disabled={loading}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Bạn bè</p>
                      <p className="text-xs text-gray-500">
                        Chỉ bạn bè có thể xem bài viết
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Friend Requests */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Lời mời kết bạn
                  </h3>
                  <p className="text-sm text-gray-500">
                    Cho phép người khác gửi lời mời kết bạn
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allow_friend_requests}
                  onChange={(e) =>
                    updatePrivacySetting('allow_friend_requests', e.target.checked)
                  }
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Online Status */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <EyeOff className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Hiển thị trạng thái trực tuyến
                  </h3>
                  <p className="text-sm text-gray-500">
                    Cho phép bạn bè xem khi bạn đang trực tuyến
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.show_online_status}
                  onChange={(e) =>
                    updatePrivacySetting('show_online_status', e.target.checked)
                  }
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong> Một số cài đặt có thể cần thời gian để có hiệu
            lực trên toàn hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
