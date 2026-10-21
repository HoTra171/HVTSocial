import React, { useState, useEffect, useRef } from 'react';
import { X, Image, Smile, MapPin, Globe, Users, Lock, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { postApi, uploadApi } from '../../api';

const MOODS = [
  { emoji: '😊', label: 'Vui vẻ' },
  { emoji: '🥰', label: 'Hạnh phúc' },
  { emoji: '😎', label: 'Hào hứng' },
  { emoji: '☕', label: 'Thư giãn' },
  { emoji: '🔥', label: 'Nhiệt huyết' },
  { emoji: '🎉', label: 'Ăn mừng' },
  { emoji: '✈️', label: 'Đang du lịch' },
  { emoji: '💪', label: 'Quyết tâm' },
];

export const CreatePostModal = ({ isOpen, onClose, onPostCreated, currentUser }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('public');
  const [selectedMood, setSelectedMood] = useState(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Manage image preview URLs
  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      toast.error('Vui lòng nhập nội dung hoặc chọn ảnh để đăng');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload ảnh nếu có
      let mediaUrls = [];
      if (images.length > 0) {
        const uploadRes = await uploadApi.uploadMultiple(images);
        mediaUrls = uploadRes.data?.urls || [];
      }

      // Ghép mood và location vào nội dung nếu có
      let fullContent = content.trim();
      const metaAddons = [];
      if (selectedMood) {
        metaAddons.push(`${selectedMood.emoji} Đang cảm thấy ${selectedMood.label}`);
      }
      if (locationName.trim()) {
        metaAddons.push(`📍 Tại ${locationName.trim()}`);
      }
      if (metaAddons.length > 0) {
        fullContent = fullContent ? `${fullContent}\n\n— ${metaAddons.join(' • ')}` : metaAddons.join(' • ');
      }

      // 2. Tạo bài viết
      const res = await postApi.create({
        content: fullContent,
        media: mediaUrls.join(';'),
        status,
      });

      const newPost = res.data?.post || res.data?.data || res.data;

      // Đảm bảo gắn thông tin user hiện tại vào post để hiển thị tức thì
      if (newPost && currentUser) {
        newPost.user = {
          id: currentUser.id,
          full_name: currentUser.full_name,
          username: currentUser.username,
          avatar: currentUser.avatar || currentUser.profile_picture || '/default.jpg',
        };
      }

      toast.success('Đã đăng bài viết mới thành công! 🎉');

      if (typeof onPostCreated === 'function') {
        onPostCreated(newPost);
      }

      // Reset form & đóng modal
      setContent('');
      setImages([]);
      setSelectedMood(null);
      setLocationName('');
      onClose();
    } catch (err) {
      console.error('Lỗi khi tạo bài viết:', err);
      toast.error(err.response?.data?.message || err.message || 'Không thể đăng bài viết');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-center">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
            Tạo bài viết
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* User info & privacy */}
          <div className="flex items-center gap-3">
            <img
              src={currentUser?.avatar || currentUser?.profile_picture || '/default.jpg'}
              alt={currentUser?.full_name || 'User'}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              onError={(e) => {
                e.currentTarget.src = '/default.jpg';
              }}
            />
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                {currentUser?.full_name || 'Bạn'}
              </h3>
              {/* Privacy selector pill */}
              <div className="relative inline-block mt-0.5">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium pl-6 pr-6 py-1 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition focus:outline-none"
                >
                  <option value="public">Công khai</option>
                  <option value="friends">Bạn bè</option>
                  <option value="private">Chỉ mình tôi</option>
                </select>
                <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-500">
                  {status === 'public' && <Globe size={12} />}
                  {status === 'friends' && <Users size={12} />}
                  {status === 'private' && <Lock size={12} />}
                </div>
              </div>
            </div>
          </div>

          {/* Text input area */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Bạn đang nghĩ gì thế, ${currentUser?.full_name?.split(' ').pop() || 'bạn'}?`}
              className="w-full text-base sm:text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 bg-transparent resize-none focus:outline-none leading-relaxed"
            />

            {/* Selected Mood Badge */}
            {selectedMood && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full mb-2">
                <span>{selectedMood.emoji} Đang cảm thấy {selectedMood.label}</span>
                <button
                  type="button"
                  onClick={() => setSelectedMood(null)}
                  className="hover:text-amber-900 ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Selected Location Badge */}
            {locationName && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-full mb-2 ml-2">
                <MapPin size={12} />
                <span>Tại {locationName}</span>
                <button
                  type="button"
                  onClick={() => setLocationName('')}
                  className="hover:text-rose-900 ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Location input popup */}
          {showLocationInput && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <MapPin size={16} className="text-rose-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Bạn đang ở đâu? (ví dụ: Hà Nội, Hồ Gươm, Đà Lạt...)"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowLocationInput(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Mood Selector Grid */}
          {showMoodPicker && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => {
                    setSelectedMood(m);
                    setShowMoodPicker(false);
                  }}
                  className="flex items-center gap-1 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 transition text-left"
                >
                  <span className="text-base">{m.emoji}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Image Previews */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                  <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Media & Options Toolbar (Facebook style) */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Thêm vào bài viết của bạn
            </span>

            <div className="flex items-center gap-1">
              {/* Photo button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 transition"
                title="Ảnh / Video"
              >
                <Image size={20} />
              </button>

              {/* Mood button */}
              <button
                type="button"
                onClick={() => setShowMoodPicker((prev) => !prev)}
                className="p-2 rounded-full hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-500 transition"
                title="Cảm xúc / Hoạt động"
              >
                <Smile size={20} />
              </button>

              {/* Location button */}
              <button
                type="button"
                onClick={() => setShowLocationInput((prev) => !prev)}
                className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition"
                title="Check-in vị trí"
              >
                <MapPin size={20} />
              </button>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setImages((prev) => [...prev, ...files]);
            }}
          />
        </div>

        {/* Modal Footer / Submit */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && images.length === 0)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Đang đăng bài...</span>
              </>
            ) : (
              <span>Đăng bài</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
