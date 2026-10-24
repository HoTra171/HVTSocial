// src/components/chat/GroupInfoDrawer.jsx
import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  UserPlus,
  LogOut,
  Edit2,
  Check,
  Shield,
  Trash2,
  Search,
  Loader2,
  ChevronRight,
  Info,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_URL } from "../../constants/api";
import { getFullImageUrl, handleImageError } from "../../utils/imageHelper";

const GroupInfoDrawer = ({
  isOpen,
  onClose,
  chatId,
  currentUserId,
  onGroupUpdated,
  onLeaveGroup,
}) => {
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Thêm thành viên
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [friendsSearch, setFriendsSearch] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);

  const myId = Number(currentUserId);

  const fetchGroupDetails = async () => {
    if (!chatId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/chat/group/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupDetails(res.data);
      setNewName(res.data?.name || "");
    } catch (err) {
      console.error("Fetch group details error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && chatId) {
      fetchGroupDetails();
    }
  }, [isOpen, chatId]);

  // Load danh sách bạn bè chưa có trong nhóm khi mở AddMemberModal
  const handleOpenAddMemberModal = async () => {
    setShowAddMemberModal(true);
    setSelectedNewMembers([]);
    setFriendsSearch("");
    setLoadingFriends(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/friendships/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allFriends = res.data?.data || res.data || [];
      const currentMemberIds = new Set((groupDetails?.members || []).map((m) => Number(m.id)));

      // Lọc những người chưa có trong nhóm
      const available = allFriends.filter((f) => {
        const fid = Number(f.id || f.user_id || f.friend_id);
        return !currentMemberIds.has(fid);
      });
      setFriends(available);
    } catch (err) {
      console.error("Error loading friends:", err);
      toast.error("Không thể tải danh sách bạn bè");
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === groupDetails?.name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/chat/group/${chatId}/info`,
        { name: newName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã đổi tên nhóm");
      setIsEditingName(false);
      fetchGroupDetails();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      console.error("Save name error:", err);
      toast.error("Không thể đổi tên nhóm");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleAddMembersSubmit = async () => {
    if (selectedNewMembers.length === 0) return;
    setAddingMembers(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/chat/group/${chatId}/members`,
        { memberIds: selectedNewMembers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã thêm thành viên vào nhóm");
      setShowAddMemberModal(false);
      fetchGroupDetails();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      console.error("Add members error:", err);
      toast.error("Không thể thêm thành viên");
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${memberName}" khỏi nhóm?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/chat/group/${chatId}/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Đã xóa ${memberName} khỏi nhóm`);
      fetchGroupDetails();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err) {
      console.error("Remove member error:", err);
      toast.error("Không thể xóa thành viên");
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Bạn có chắc muốn rời khỏi nhóm chat này?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/chat/group/${chatId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Đã rời khỏi nhóm chat");
      onClose();
      if (onLeaveGroup) onLeaveGroup();
    } catch (err) {
      console.error("Leave group error:", err);
      toast.error("Không thể rời khỏi nhóm");
    }
  };

  if (!isOpen) return null;

  const currentMember = groupDetails?.members?.find((m) => Number(m.id) === myId);
  const isMeAdmin = currentMember?.is_admin || Number(groupDetails?.created_by) === myId;
  const members = groupDetails?.members || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full sm:w-80 md:w-96 bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slide-left">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <Info size={18} className="text-indigo-600" />
            <span>Thông tin nhóm chat</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Đang tải thông tin...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {/* Group Identity Card */}
            <div className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800">
                  <Users size={36} />
                </div>
              </div>

              {/* Tên nhóm có thể sửa */}
              {isEditingName ? (
                <div className="flex items-center gap-2 w-full max-w-[240px] mt-1">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm font-semibold rounded-lg border border-indigo-400 dark:border-indigo-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    {isSavingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </button>
                  <button
                    onClick={() => {
                      setNewName(groupDetails?.name || "");
                      setIsEditingName(false);
                    }}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1 group">
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                    {groupDetails?.name || "Nhóm trò chuyện"}
                  </h3>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition"
                    title="Đổi tên nhóm"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {members.length} thành viên
              </p>
            </div>

            {/* Actions Quick Grid */}
            <div className="p-4 flex items-center justify-center gap-4">
              <button
                onClick={handleOpenAddMemberModal}
                className="flex flex-col items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 flex items-center justify-center transition">
                  <UserPlus size={18} className="text-slate-600 dark:text-slate-300 group-hover:text-indigo-600" />
                </div>
                <span>Thêm người</span>
              </button>

              <button
                onClick={handleLeaveGroup}
                className="flex flex-col items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:opacity-80 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/60 flex items-center justify-center transition">
                  <LogOut size={18} className="text-red-600 dark:text-red-400" />
                </div>
                <span>Rời nhóm</span>
              </button>
            </div>

            {/* Danh sách thành viên */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Thành viên ({members.length})
                </span>
                <button
                  onClick={handleOpenAddMemberModal}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus size={13} /> Thêm
                </button>
              </div>

              <div className="space-y-3">
                {members.map((member) => {
                  const isCreatorOrAdmin = member.is_admin || Number(member.id) === Number(groupDetails?.created_by);
                  const isThisMe = Number(member.id) === myId;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-1 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={getFullImageUrl(member.avatar)}
                          alt=""
                          onError={handleImageError}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                              {member.full_name || member.username}
                            </span>
                            {isThisMe && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                (Bạn)
                              </span>
                            )}
                          </div>
                          {isCreatorOrAdmin && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              <Shield size={10} /> Trưởng nhóm
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nút xóa thành viên (chỉ Admin mới có quyền xóa người khác) */}
                      {isMeAdmin && !isThisMe && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.full_name || member.username)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition opacity-0 group-hover:opacity-100"
                          title="Xóa khỏi nhóm"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Con: Thêm thành viên vào nhóm */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Thêm bạn bè vào nhóm
              </h4>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm bạn bè..."
                  value={friendsSearch}
                  onChange={(e) => setFriendsSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingFriends ? (
                <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span>Đang tải...</span>
                </div>
              ) : friends.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">
                  Tất cả bạn bè đã ở trong nhóm này
                </p>
              ) : (
                friends
                  .filter((f) =>
                    (f.full_name || f.name || "").toLowerCase().includes(friendsSearch.toLowerCase())
                  )
                  .map((friend) => {
                    const fid = Number(friend.id || friend.user_id || friend.friend_id);
                    const isSelected = selectedNewMembers.includes(fid);
                    return (
                      <div
                        key={fid}
                        onClick={() => {
                          setSelectedNewMembers((prev) =>
                            prev.includes(fid) ? prev.filter((id) => id !== fid) : [...prev, fid]
                          );
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={getFullImageUrl(friend.avatar || friend.profile_picture)}
                            alt=""
                            onError={handleImageError}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {friend.full_name || friend.name}
                          </span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-300 dark:border-slate-600 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleAddMembersSubmit}
                disabled={addingMembers || selectedNewMembers.length === 0}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5"
              >
                {addingMembers && <Loader2 size={14} className="animate-spin" />}
                <span>Thêm ({selectedNewMembers.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupInfoDrawer;
