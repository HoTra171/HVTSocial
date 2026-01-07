import React, { useState } from "react";
import { Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL, SERVER_ORIGIN } from '../constants/api';

const ChangePassword = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const validate = () => {
    const err = {};

    if (!currentPassword.trim()) {
      err.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    if (!newPassword.trim()) {
      err.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (newPassword.length < 6) {
      err.newPassword = "Mật khẩu mới phải từ 6 ký tự trở lên";
    }

    if (!confirmPassword.trim()) {
      err.confirmPassword = "Vui lòng nhập lại mật khẩu mới";
    } else if (newPassword !== confirmPassword) {
      err.confirmPassword = "Mật khẩu nhập lại không khớp";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Bạn chưa đăng nhập!");
      return;
    }

    setLoading(true);

    const promise = axios.put(
      `${API_URL}/auth/change-password`,
      {
        currentPassword,
        newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    toast
      .promise(promise, {
        loading: "Đang đổi mật khẩu...",
        success: "Đổi mật khẩu thành công!",
        error: (err) =>
          err?.response?.data?.message || "Đổi mật khẩu thất bại!",
      })
      .then(() => {
        // reset form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // điều hướng về profile của chính mình nếu có userId
        const userId = localStorage.getItem("userId");
        if (userId) {
          navigate(`/profile/${userId}`);
        } else {
          navigate(-1); 
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white sm:-ml-60">
      <div className="max-w-3xl mx-auto p-6">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Đổi mật khẩu
          </h1>
          <p className="text-slate-600 text-sm">
            Vì lý do bảo mật, vui lòng không chia sẻ mật khẩu cho bất kỳ ai.
          </p>
        </div>

        {/* Card */}
        <div className="max-w-xl bg-white p-6 sm:p-8 rounded-xl shadow-md space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="p-3 rounded-full bg-indigo-50">
              <Lock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                Bảo mật tài khoản
              </p>
              <p className="text-xs text-slate-500">
                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản tốt hơn.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nhập mật khẩu hiện tại"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ít nhất 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm new password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nhập lại mật khẩu mới
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Hint */}
            <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
              <li>
                Nên dùng mật khẩu khó đoán, kết hợp chữ, số và ký tự đặc biệt.
              </li>
              <li>Không sử dụng lại mật khẩu đã từng dùng trước đây.</li>
            </ul>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 mt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 transition text-white font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
