// src/components/chat/CreateGroupModal.jsx
import React, { useState, useEffect } from "react";
import { X, Search, Users, Check, Loader2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../../constants/api";
import { getFullImageUrl, handleImageError } from "../../utils/imageHelper";

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated, currentUserId }) => {
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setSearchTerm("");
      setSelectedUserIds([]);
      return;
    }

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/friendships/friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const rawList = res.data?.data || res.data || [];
        // Lọc bỏ chính mình
        const list = rawList.filter(
          (u) => Number(u.id || u.user_id || u.friend_id) !== Number(currentUserId)
        );
        setFriends(list);
      } catch (err) {
        console.error("Error fetching friends:", err);
        toast.error("Không thể tải danh sách bạn bè");
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const toggleSelectUser = (id) => {
    const numId = Number(id);
    setSelectedUserIds((prev) =>
      prev.includes(numId) ? prev.filter((item) => item !== numId) : [...prev, numId]
    );
  };

  const filteredFriends = friends.filter((u) => {
    const name = (u.full_name || u.name || u.username || "").toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const selectedUsers = friends.filter((u) =>
    selectedUserIds.includes(Number(u.id || u.user_id || u.friend_id))
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 thành viên cho nhóm");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/chat/group`,
        {
          name: groupName.trim(),
          memberIds: selectedUserIds,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Tạo nhóm chat thành công!");
      onClose();
      if (onGroupCreated && res.data?.chat) {
        onGroupCreated(res.data.chat);
      }
    } catch (err) {
      console.error("Create group error:", err);
      toast.error(err.response?.data?.error || "Không thể tạo nhóm chat");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users size={18} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Tạo nhóm chat mới
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 space-y-4">
            {/* Tên nhóm */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tên nhóm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Nhập tên nhóm (ví dụ: Hội bạn thân, Team dự án...)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
              />
            </div>

            {/* Tìm kiếm thành viên */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Thêm thành viên ({selectedUserIds.length} đã chọn)
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm bạn bè theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                />
              </div>
            </div>

            {/* Chip hiển thị các thành viên đã chọn */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1">
                {selectedUsers.map((user) => {
                  const uid = Number(user.id || user.user_id || user.friend_id);
                  return (
                    <span
                      key={uid}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full text-xs font-medium"
                    >
                      <img
                        src={getFullImageUrl(user.avatar || user.profile_picture)}
                        alt=""
                        onError={handleImageError}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="truncate max-w-[100px]">{user.full_name || user.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(uid)}
                        className="hover:text-red-500 ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Danh sách bạn bè để chọn */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs">Đang tải danh sách bạn bè...</span>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                {searchTerm ? "Không tìm thấy bạn bè phù hợp" : "Chưa có bạn bè nào để thêm"}
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const uid = Number(friend.id || friend.user_id || friend.friend_id);
                const isSelected = selectedUserIds.includes(uid);
                return (
                  <div
                    key={uid}
                    onClick={() => toggleSelectUser(uid)}
                    className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getFullImageUrl(friend.avatar || friend.profile_picture)}
                        alt=""
                        onError={handleImageError}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {friend.full_name || friend.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          @{friend.username || "nguoidung"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-300 dark:border-slate-600 bg-transparent"
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !groupName.trim() || selectedUserIds.length === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>Tạo nhóm chat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
