import React, { useState } from 'react';
import { Trash2, Clock, Check, X, UserCheck, MessageCircle, Heart, ArrowRight } from 'lucide-react';
import { safeFromNow } from '../../utils/dateHelpers';
import NotificationIcon from './NotificationIcon';
import { friendApi } from '../../api/friendApi';
import toast from 'react-hot-toast';

const NotificationItem = ({ notif, onRead, onDelete }) => {
  const isUnread = notif.status === 'unread' || notif.is_read === false;
  const [friendActionDone, setFriendActionDone] = useState(null); // 'accepted' | 'rejected'
  const [actionLoading, setActionLoading] = useState(false);

  const handleAcceptFriend = async (e) => {
    e.stopPropagation();
    if (!notif.sender_id) return;
    setActionLoading(true);
    try {
      await friendApi.acceptRequest(notif.sender_id);
      setFriendActionDone('accepted');
      toast.success('Đã chấp nhận lời mời kết bạn');
      onRead?.();
    } catch (err) {
      toast.error('Không thể chấp nhận lời mời');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectFriend = async (e) => {
    e.stopPropagation();
    if (!notif.sender_id) return;
    setActionLoading(true);
    try {
      await friendApi.rejectRequest(notif.sender_id);
      setFriendActionDone('rejected');
      toast.success('Đã từ chối lời mời kết bạn');
      onRead?.();
    } catch (err) {
      toast.error('Không thể từ chối lời mời');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      onClick={onRead}
      className={`group relative flex items-start gap-3.5 sm:gap-4 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isUnread
          ? 'bg-gradient-to-r from-indigo-50/90 via-white to-white dark:from-indigo-950/30 dark:via-slate-900/90 dark:to-slate-900/90 border-indigo-200/90 dark:border-indigo-800/60 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700'
          : 'bg-white dark:bg-slate-900/70 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm'
      }`}
    >
      {/* Avatar & Notification Type Pill Badge */}
      <div className="relative flex-shrink-0">
        <img
          src={notif.sender_avatar || '/default.jpg'}
          alt={notif.sender_name || 'User'}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-sm border border-slate-100 dark:border-slate-700"
          onError={(e) => {
            e.currentTarget.src = '/default.jpg';
          }}
        />
        <div className="absolute -bottom-1 -right-1 p-0.5 bg-white dark:bg-slate-900 rounded-full shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 flex items-center justify-center">
          <NotificationIcon type={notif.type} content={notif.content} />
        </div>
      </div>

      {/* Content & Details */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
          <span className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            {notif.sender_name || 'Hệ thống'}
          </span>{' '}
          <span className="text-slate-700 dark:text-slate-300 font-normal">
            {notif.content || 'đã tương tác với bạn'}
          </span>
        </div>

        {/* Time Stamp */}
        <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
          <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
          <span>{safeFromNow(notif.created_at || notif.createdAt)}</span>
        </p>

        {/* Quick Actions for Friend Requests */}
        {notif.type === 'friend_request' && (
          <div className="mt-2.5 flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
            {friendActionDone === 'accepted' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                <Check className="w-3.5 h-3.5" />
                Đã trở thành bạn bè
              </span>
            ) : friendActionDone === 'rejected' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-semibold">
                Đã từ chối lời mời
              </span>
            ) : (
              <>
                <button
                  onClick={handleAcceptFriend}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 active:scale-95 transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Chấp nhận</span>
                </button>
                <button
                  onClick={handleRejectFriend}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold active:scale-95 transition flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Unread Glow Dot */}
      {isUnread && (
        <span className="absolute top-5 right-11 w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-400 rounded-full ring-4 ring-indigo-100 dark:ring-indigo-950/60 animate-pulse" />
      )}

      {/* Quick Delete Action */}
      <div className="absolute top-3.5 right-3 opacity-0 group-hover:opacity-100 transition-all duration-150">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notif.id);
          }}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
          title="Xóa thông báo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
