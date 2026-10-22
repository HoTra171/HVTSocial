import React from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  UserCheck,
  AtSign,
  Eye,
  AlertCircle,
  Bell,
  Sparkles,
} from 'lucide-react';

const NotificationIcon = ({ type, content = '' }) => {
  switch (type) {
    case 'like':
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-md">
          <Heart className="w-3 h-3 fill-current" />
        </div>
      );
    case 'comment':
    case 'reply':
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
          <MessageCircle className="w-3 h-3 fill-current" />
        </div>
      );
    case 'friend_request':
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md">
          <UserPlus className="w-3 h-3" />
        </div>
      );
    case 'friend_accept':
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
          <UserCheck className="w-3 h-3" />
        </div>
      );
    case 'message':
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-md">
          <MessageCircle className="w-3 h-3" />
        </div>
      );
    case 'share':
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 text-white flex items-center justify-center shadow-md">
          <Share2 className="w-3 h-3" />
        </div>
      );
    case 'story_view':
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md">
          <Eye className="w-3 h-3" />
        </div>
      );
    case 'post_tag':
    case 'comment_tag':
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md">
          <AtSign className="w-3 h-3" />
        </div>
      );
    case 'report':
      return (
        <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
          <AlertCircle className="w-3 h-3" />
        </div>
      );
    default:
      if (content?.includes('chia sẻ bài viết')) {
        return (
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-teal-600 to-emerald-400 text-white flex items-center justify-center shadow-md">
            <Share2 className="w-3 h-3" />
          </div>
        );
      }
      return (
        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-slate-600 to-gray-500 text-white flex items-center justify-center shadow-md">
          <Bell className="w-3 h-3" />
        </div>
      );
  }
};

export default NotificationIcon;
