import React, { useState } from "react";
import axios from "axios";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { API_URL, SERVER_ORIGIN } from '../constants/api';
import { Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);          // 1: nhập email, 2: nhập OTP + mật khẩu mới
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const navigate = useNavigate();

  // Bước 1: gửi OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/auth/request-reset-otp`,
        { email }
      );
      setMessage(res.data.message || "Mã OTP đã được gửi tới email của bạn.");
      setStep(2); // chuyển sang bước nhập OTP
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Không thể gửi mã OTP. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: xác thực OTP + đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/auth/reset-password-otp`,
        { email, otp, newPassword }
      );
      setMessage(res.data.message || "Đổi mật khẩu thành công.");

      // Đổi mật khẩu xong quay về đăng nhập
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Không thể đổi mật khẩu. Vui lòng kiểm tra lại OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    // Quay lại bước 1 để nhập email / gửi lại OTP
    setStep(1);
    setOtp("");
    setNewPassword("");
    setMessage("");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Background */}
      <img
        src={assets.bgImage}
        alt=""
        className="absolute top-0 left-0 -z-10 w-full h-full object-cover"
      />

      {/* Left section */}
      <div className="flex-1 flex flex-col items-start p-6 md:p-10 lg:pl-40">
        <img
          src={assets.logo}
          alt="Logo"
          className="h-18 object-contain absolute top-5"
        />

        <div className="max-w-md mt-32">
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-3">
            Quên mật khẩu?
          </h1>
          <p className="text-lg text-indigo-800">
            {step === 1
              ? "Nhập email để nhận mã OTP khôi phục mật khẩu."
              : "Nhập mã OTP và mật khẩu mới để hoàn tất khôi phục."}
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-indigo-900">
            {step === 1 ? "Khôi phục mật khẩu" : "Nhập OTP & mật khẩu mới"}
          </h2>

          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-indigo-600 text-white p-3 rounded-lg transition cursor-pointer ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-indigo-700"
                  }`}
              >
                {loading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              <input
                type="text"
                placeholder="Nhập mã OTP"
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              <div className="relative mb-4">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-indigo-600 text-white p-3 rounded-lg transition cursor-pointer ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-indigo-700"
                  }`}
              >
                {loading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </button>

              <button
                type="button"
                onClick={handleBackToEmail}
                className="w-full mt-3 text-sm text-indigo-600 hover:underline"
              >
                Gửi lại OTP / đổi email
              </button>
            </form>
          )}

          {message && (
            <p className="text-green-600 mt-3 text-center text-sm">{message}</p>
          )}
          {error && (
            <p className="text-red-500 mt-3 text-center text-sm">{error}</p>
          )}

          <p
            onClick={() => navigate("/")}
            className="text-sm text-center text-indigo-700 mt-4 cursor-pointer hover:underline"
          >
            Quay lại đăng nhập
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
