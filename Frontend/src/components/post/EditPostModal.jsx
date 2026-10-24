import React, { useState, useEffect, useRef } from 'react';
import { X, Image, Globe, Users, Lock, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { postApi, uploadApi } from '../../api';

export const EditPostModal = ({ isOpen, onClose, post, onPostUpdated, currentUser }) => {
  if (!isOpen || !post) return null;

  const parseExistingImages = () => {
    if (Array.isArray(post.image_urls)) return post.image_urls.filter(Boolean);
    if (typeof post.media_url === 'string') {
      return post.media_url.split(';').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const [content, setContent] = useState(post.content || '');
  const [existingImages, setExistingImages] = useState(parseExistingImages);
  const [newImages, setNewImages] = useState([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState([]);
  const [status, setStatus] = useState(String(post.status || post.visibility || 'public').toLowerCase());
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setContent(post.content || '');
    setExistingImages(parseExistingImages());
    setNewImages([]);
    setStatus(String(post.status || post.visibility || 'public').toLowerCase());
  }, [post]);

  useEffect(() => {
    const urls = newImages.map((file) => URL.createObjectURL(file));
    setNewPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [newImages]);

  const handleRemoveExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveNewImage = (idx) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewImages((prev) => [...prev, ...files]);
    }
  };

  const handleSave = async () => {
    if (!content.trim() && existingImages.length === 0 && newImages.length === 0) {
      toast.error('Bài viết phải có ít nhất nội dung hoặc hình ảnh');
      return;
    }

    try {
      setSaving(true);

      // 1. Upload ảnh mới nếu có
      let uploadedNewUrls = [];
      if (newImages.length > 0) {
        const uploadRes = await uploadApi.uploadMultiple(newImages);
        uploadedNewUrls = uploadRes.data?.urls || [];
      }

      // 2. Tổng hợp tất cả ảnh
      const allMediaUrls = [...existingImages, ...uploadedNewUrls];

      // 3. Gọi API cập nhật bài viết
      const res = await postApi.update(post.id, {
        content: content.trim(),
        media: allMediaUrls.join(';'),
        status,
      });

      const updated = res.data?.post || res.data?.data || res.data;
      if (updated) {
        // Đồng bộ ảnh và user
        updated.image_urls = allMediaUrls;
        if (!updated.user && post.user) {
          updated.user = post.user;
        }
      }

      toast.success('Đã cập nhật bài viết thành công! ✨');
      if (typeof onPostUpdated === 'function') {
        onPostUpdated(updated || {
          ...post,
          content: content.trim(),
          media_url: allMediaUrls.join(';'),
          image_urls: allMediaUrls,
          status,
          visibility: status,
        });
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi cập nhật bài viết:', err);
      toast.error(err.response?.data?.message || 'Không thể lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-center">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
            Chỉnh sửa bài viết
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* User info & Privacy selector */}
          <div className="flex items-center gap-3">
            <img
              src={currentUser?.avatar || currentUser?.profile_picture || '/default.jpg'}
              alt={currentUser?.full_name || 'User'}
              className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              onError={(e) => {
                e.currentTarget.src = '/default.jpg';
              }}
            />
            <div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {currentUser?.full_name || 'Bạn'}
              </h3>
              {/* Privacy Selector */}
              <div className="relative inline-block mt-0.5">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold pl-6 pr-6 py-1 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition focus:outline-none"
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

          {/* Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang nghĩ gì thế?"
            rows={4}
            className="w-full p-3 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm sm:text-base border border-slate-200 dark:border-slate-700/80 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none transition-all leading-relaxed"
          />

          {/* Images Section */}
          {(existingImages.length > 0 || newPreviewUrls.length > 0) && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Hình ảnh đính kèm ({existingImages.length + newPreviewUrls.length})
              </label>

              <div className="grid grid-cols-3 gap-2">
                {/* Existing Images */}
                {existingImages.map((url, idx) => (
                  <div key={`exist-${idx}`} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition shadow-md cursor-pointer"
                      title="Gỡ ảnh"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}

                {/* Newly Added Images */}
                {newPreviewUrls.map((url, idx) => (
                  <div key={`new-${idx}`} className="relative group rounded-xl overflow-hidden aspect-square border-2 border-indigo-500 bg-slate-100 dark:bg-slate-800">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition shadow-md cursor-pointer"
                      title="Gỡ ảnh mới"
                    >
                      <X size={13} />
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-indigo-600 text-[10px] text-white rounded-md font-bold">Mới</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add more images button */}
          <div className="pt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Image size={16} className="text-emerald-500" />
              <span>Thêm ảnh mới vào bài viết</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu thay đổi</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
