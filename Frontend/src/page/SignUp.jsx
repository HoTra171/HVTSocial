import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const SignUp = () => {
  const navigate = useNavigate();
  const { currentUser, register } = useAuth();

  // Nếu đã đăng nhập, tự động chuyển đến /feed
  useEffect(() => {
    if (currentUser?.id) {
      navigate('/feed', { replace: true });
    }
  }, [currentUser, navigate]);

  // State management
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    date_of_birth: '',
    gender: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Validate form
  const validateForm = () => {
    const { full_name, username, email, password, confirmPassword, date_of_birth, gender } = form;

    if (!full_name || !username || !email || !password || !date_of_birth || !gender) {
      setError('Vui lòng điền đầy đủ tất cả các trường bắt buộc (*)');
      return false;
    }

    if (full_name.trim().length < 2) {
      setError('Họ và tên phải có ít nhất 2 ký tự');
      return false;
    }

    // Validate username: only alphanumeric, 3-30 chars
    const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
    if (!usernameRegex.test(username.trim())) {
      setError('Tên người dùng từ 3-30 ký tự, chỉ gồm chữ cái và số (không dấu, không khoảng trắng, không ký tự đặc biệt)');
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Email không đúng định dạng (ví dụ: ban@gmail.com)');
      return false;
    }

    // Validate password: min 8 chars, uppercase, lowercase, number
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      setError('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số');
      return false;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }

    // Validate date of birth
    if (new Date(date_of_birth) > new Date()) {
      setError('Ngày sinh không thể ở trong tương lai');
      return false;
    }

    return true;
  };

  // Handle sign up
  const handleSignUp = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setError('');

    // Validate
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { full_name, username, email, password, date_of_birth, gender } = form;

      await register({
        full_name: full_name.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        date_of_birth,
        gender,
      });

      toast.success('Đăng ký thành công! Chào mừng bạn đến với HVTSocial 🎉');
      navigate('/feed');
    } catch (err) {
      console.error('Sign up error:', err);
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        err.message ||
        'Đăng ký thất bại, vui lòng thử lại';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Background */}
      <img
        src={assets.bgImage}
        alt=""
        className="absolute top-0 left-0 -z-10 w-full h-full object-cover"
      />

      {/* Left side */}
      <div className="flex-1 flex flex-col items-start p-6 md:p-10 lg:pl-40">
        <img
          src={assets.logo}
          alt="Logo"
          className="h-18 object-contain absolute top-5"
        />
        <div className="max-w-md mt-32">
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-3">
            Tạo tài khoản mới
          </h1>
          <p className="text-lg text-indigo-800">
            Kết nối cùng cộng đồng HVTSocial
          </p>
        </div>
      </div>

      {/* Right side: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-indigo-900">
            Đăng ký
          </h2>

          <form onSubmit={handleSignUp}>
            {/* Full Name */}
            <input
              type="text"
              name="full_name"
              placeholder="Họ và tên *"
              value={form.full_name}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
            />

            {/* Username */}
            <input
              type="text"
              name="username"
              placeholder="Tên người dùng (viết liền, không dấu) *"
              value={form.username}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-3 mb-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
            />
            <p className="text-xs text-gray-500 mb-3 px-1">Chỉ gồm chữ cái và số (ví dụ: nguyenvana123, 3-30 ký tự)</p>

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
            />

            {/* Password */}
            <div className="relative mb-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mật khẩu (ít nhất 8 ký tự) *"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3 px-1">Gồm tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường và 1 số</p>

            {/* Confirm Password */}
            <div className="relative mb-4">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Xác nhận lại mật khẩu *"
                value={form.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Date of Birth */}
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
            />

            {/* Gender */}
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
            >
              <option value="">Giới tính *</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-70 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang tạo tài khoản...
                </span>
              ) : (
                'Đăng ký'
              )}
            </button>

            {/* Login Link */}
            <p
              onClick={() => !loading && navigate('/')}
              className={`text-sm text-center text-indigo-700 mt-4 hover:underline ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                }`}
            >
              Đã có tài khoản? Đăng nhập ngay
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;