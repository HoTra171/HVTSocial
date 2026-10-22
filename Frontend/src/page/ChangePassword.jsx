import React, { useState, useMemo } from "react";
import {
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";
import { useAuth } from "../contexts/AuthContext";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successDone, setSuccessDone] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password rules validation
  const rules = useMemo(() => {
    return {
      length: newPassword.length >= 6,
      hasLetter: /[a-zA-Z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[^a-zA-Z0-9]/.test(newPassword),
      match: newPassword.length > 0 && newPassword === confirmPassword,
      notSameAsOld: !currentPassword || (newPassword && newPassword !== currentPassword),
    };
  }, [newPassword, confirmPassword, currentPassword]);

  // Password strength calculation
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "Chưa nhập", color: "bg-slate-200", text: "text-slate-400" };
    let score = 0;
    if (rules.length) score += 1;
    if (rules.hasLetter) score += 1;
    if (rules.hasNumber) score += 1;
    if (rules.hasSpecial) score += 1;
    if (newPassword.length >= 10) score += 1;

    if (score <= 2) {
      return { score: 1, label: "Yếu", color: "bg-red-500", text: "text-red-500", width: "w-1/3" };
    }
    if (score <= 4) {
      return { score: 2, label: "Trung bình", color: "bg-amber-500", text: "text-amber-500", width: "w-2/3" };
    }
    return { score: 3, label: "Rất mạnh", color: "bg-emerald-500", text: "text-emerald-500", width: "w-full" };
  }, [newPassword, rules]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    if (!rules.length) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("Mật khẩu mới không được trùng với mật khẩu hiện tại");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp");
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.changePassword({
        currentPassword,
        oldPassword: currentPassword,
        newPassword,
      });

      if (res.data?.success || res.status === 200) {
        toast.success("Đổi mật khẩu thành công!");
        setSuccessDone(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Tự động chuyển trang sau 1.8 giây
        setTimeout(() => {
          const profileId = currentUser?.id || JSON.parse(localStorage.getItem("user") || "{}")?.id;
          if (profileId) {
            navigate(`/profile/${profileId}`);
          } else {
            navigate(-1);
          }
        }, 1800);
      } else {
        toast.error(res.data?.message || "Đổi mật khẩu thất bại");
      }
    } catch (err) {
      console.error("Change password error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Đổi mật khẩu thất bại, vui lòng kiểm tra lại mật khẩu hiện tại";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/30 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white rounded-xl shadow-sm border border-slate-200/80 transition-all cursor-pointer mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-white shadow-inner flex-shrink-0">
                <KeyRound className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Đổi mật khẩu
                </h1>
                <p className="text-indigo-100 text-sm mt-1.5 leading-relaxed">
                  Cập nhật mật khẩu thường xuyên giúp bảo vệ tài khoản và dữ liệu cá nhân của bạn trên HVTSocial.
                </p>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {successDone && (
            <div className="m-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
              <div className="text-sm font-medium">
                Mật khẩu đã được thay đổi thành công! Đang chuyển hướng về trang cá nhân...
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Current Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Mật khẩu hiện tại</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại của bạn"
                  disabled={loading || successDone}
                  className="w-full px-4 py-3 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-12 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 pt-2" />

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Mật khẩu mới</span>
                </label>
                {newPassword && (
                  <span className={`text-xs font-semibold ${strength.text}`}>
                    Độ mạnh: {strength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  disabled={loading || successDone}
                  className="w-full px-4 py-3 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-12 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Strength Bar */}
              {newPassword && (
                <div className="mt-2.5">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300 ${strength.width}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  <span>Xác nhận mật khẩu mới</span>
                </label>
                {confirmPassword && (
                  <span
                    className={`text-xs font-medium ${
                      rules.match ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {rules.match ? "Khớp mật khẩu" : "Chưa khớp"}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={loading || successDone}
                  className="w-full px-4 py-3 text-sm bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-12 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Yêu cầu mật khẩu an toàn
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div
                  className={`flex items-center gap-2 ${
                    rules.length ? "text-emerald-600 font-medium" : "text-slate-500"
                  }`}
                >
                  {rules.length ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-1" />
                  )}
                  <span>Có từ 6 ký tự trở lên</span>
                </div>

                <div
                  className={`flex items-center gap-2 ${
                    rules.hasLetter ? "text-emerald-600 font-medium" : "text-slate-500"
                  }`}
                >
                  {rules.hasLetter ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-1" />
                  )}
                  <span>Bao gồm chữ cái (a-z, A-Z)</span>
                </div>

                <div
                  className={`flex items-center gap-2 ${
                    rules.hasNumber ? "text-emerald-600 font-medium" : "text-slate-500"
                  }`}
                >
                  {rules.hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-1" />
                  )}
                  <span>Bao gồm số (0-9)</span>
                </div>

                <div
                  className={`flex items-center gap-2 ${
                    rules.notSameAsOld ? "text-emerald-600 font-medium" : "text-slate-500"
                  }`}
                >
                  {rules.notSameAsOld ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-1" />
                  )}
                  <span>Khác mật khẩu hiện tại</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading || successDone}
                className="px-7 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 transition text-white shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <span>Cập nhật mật khẩu</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
