import React, { useState, useEffect } from 'react';
import { X, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_URL, SERVER_ORIGIN } from '../constants/api';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('public'); // Trạng thái hiển thị bài viết

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // Tạo preview URL cho ảnh và giải phóng khi ảnh thay đổi/unmount
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      throw new Error('Vui lòng nhập nội dung hoặc chọn ảnh');
    }

    setLoading(true);

    try {
      // Kiểm tra đăng nhập trước khi gọi API
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Bạn chưa đăng nhập');


      // Upload ảnh trước, lấy URL
      let mediaUrls = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append("files", img)); 

        const uploadRes = await axios.post(
          `${API_URL}/upload/multiple`, 
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        mediaUrls = uploadRes.data.urls || []; 
      }

      // Tạo post với URLs (nhẹ hơn nhiều)
      const res = await axios.post(
        `${API_URL}/posts`,
        {
          content,
          media: mediaUrls.join(';'), 
          status, 
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const newPost = res.data.post || res.data;

      if (typeof onPostCreated === 'function' && newPost) {
        onPostCreated(newPost);
      }

      setContent('');
      setImages([]);
      setLoading(false);

      return res;
    } catch (error) {
      console.error('Lỗi tạo bài viết:', error);
      throw error;
    } finally {
      // luôn tắt dù thành công hay không
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 to-white sm:-ml-50'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Title */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>Tạo bài viết</h1>
          <p className='text-slate-600'>Chia sẻ suy nghĩ của bạn</p>
        </div>

        {/* Form */}
        <div className='max-w-xl bg-white p-4 sm:p-8 sm:pb-3 rounded-xl shadow-md space-y-4'>
          {/* Header */}
          <div className='flex items-center gap-3'>
            <img
              src={user.profile_picture || user.avatar || `/default.jpg`}
              alt=''
              className='w-12 h-12 rounded-full shadow'
            />
            <div>
              <h2 className='font-semibold'>{user.full_name}</h2>
              <p className='text-sm text-gray-500'>@{user.username || 'user'}</p>
            </div>
          </div>

          {/* Chọn phạm vi hiển thị bài viết */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Phạm vi</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-sm border rounded-md px-3 py-2"
            >
              <option value="public">Công khai</option>
              <option value="friends">Bạn bè</option>
              <option value="private">Chỉ mình tôi</option>
            </select>
          </div>


          {/* Text Area */}
          <textarea
            className='w-full resize-none max-h-20 mt-4 text-sm outline-none placeholder-gray-400'
            placeholder='Bạn đang nghĩ gì?'
            onChange={(e) => setContent(e.target.value)}
            value={content}
          />

          {/* Images preview */}
          {images.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-4'>
              {images.map((image, i) => (
                <div key={i} className='relative group'>
                  <img
                    src={previewUrls[i]}
                    className='h-20 rounded-md'
                    alt=''
                  />
                  <div
                    onClick={() =>
                      setImages(images.filter((_, index) => index !== i))
                    }
                    className='absolute hidden group-hover:flex justify-center items-center top-0 right-0 bottom-0 left-0 bg-black/40 rounded-md cursor-pointer'
                  >
                    <X className='w-6 h-6 text-white' />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Bar */}
          <div className='flex items-center justify-between pt-3 border-t border-gray-300'>
            <label
              htmlFor='images'
              className='flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition cursor-pointer'
            >
              <Image className='size-6' />
              <span>Thêm ảnh</span>
            </label>

            <input
              type='file'
              id='images'
              accept='image/*'
              hidden
              multiple
              onChange={(e) => {
                // Thêm ảnh vào danh sách ảnh đang chọn
                const files = Array.from(e.target.files || []);
                setImages((prev) => [...prev, ...files]);
              }}
            />

            <button
              disabled={loading}
              onClick={() =>
                toast.promise(handleSubmit(), {
                  loading: 'Đang đăng...',
                  success: <p>Đã đăng bài</p>,
                  error: <p>Đăng bài thất bại</p>,
                })
              }
              className='text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
              active:scale-95 transition text-white font-medium px-8 py-2 rounded-md cursor-pointer disabled:opacity-60'
            >
              {loading ? 'Đang đăng...' : 'Đăng bài'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;