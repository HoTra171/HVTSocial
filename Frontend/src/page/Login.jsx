import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Star, Eye, EyeOff } from 'lucide-react';
import { assets } from '../assets/assets';   // bgImage, logo, group_users
import { connectSocket } from '../socket';    // hàm connect socket sau login
import { API_URL } from '../constants/api';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/auth/login`, form);

      if (res.data?.success) {
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Kết nối socket sau khi login
        connectSocket(user.id);

        toast.success('Đăng nhập thành công!');
        navigate('/feed');
      } else {
        toast.error(res.data?.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      {/* Background Image */}
      <img
        src={assets.bgImage}
        alt=""
        className="absolute top-0 left-0 -z-10 w-full h-full object-cover"
      />

      {/* Left Side (UI phần 1) */}
      <div className="flex-1 flex flex-col items-start p-6 md:p-10 lg:pl-40">
        <img
          src={assets.logo}
          alt="Logo"
          className="h-18 object-contain absolute top-5"
        />

        <div className="max-w-md mt-30 hidden md:flex justify-center flex-col">
          <div className="flex items-start gap-3 mb-4">
            <img
              src={assets.group_users}
              alt="Group Users"
              className="h-8 md:h-10"
            />
            <div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 text-transparent fill-amber-500" />
                ))}
              </div>
              <p className="text-xs md:text-sm text-indigo-900 font-medium mt-1">
                "Một cộng đồng năng động để kết nối và chia sẻ mọi khoảnh khắc trong cuộc sống."
              </p>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-3">
            Chào mừng trở lại
          </h1>
          <p className="text-lg text-indigo-800">
            Đăng nhập để tiếp tục kết nối cùng HVTSocial
          </p>
        </div>
      </div>

      {/* Right Side: Login Form (logic phần 2) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-indigo-900">
            Đăng nhập
          </h2>

          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              disabled={loading}
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={onChange}
                disabled={loading}
                placeholder="Mật khẩu"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className={`text-sm text-indigo-700 hover:underline ${loading ? 'pointer-events-none opacity-70' : ''}`}
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-70 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center my-2">
              <hr className="flex-1 border-gray-300" />
              <span className="px-3 text-gray-500 text-sm">hoặc</span>
              <hr className="flex-1 border-gray-300" />
            </div>

            <button
              type="button"
              onClick={() => !loading && navigate('/signup')}
              disabled={loading}
              className="w-full bg-white border border-indigo-600 text-indigo-600 p-3 rounded-lg hover:bg-indigo-100 transition disabled:opacity-70 disabled:cursor-not-allowed font-medium"
            >
              Tạo tài khoản mới
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
