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
} from 'lucide-react';

const NotificationIcon = ({ type, content = '' }) => {
  switch (type) {
    case 'like':
      return <Heart className="w-5 h-5 text-red-500" />;
    case 'comment':
    case 'reply':
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    case "other":
      if (content.includes("chia sẻ bài viết")) {
        return <Share2 className="w-5 h-5 text-green-500" />;
      }
      return <Bell className="w-5 h-5 text-gray-500" />;
    case 'friend_request':
      return <UserPlus className="w-5 h-5 text-indigo-500" />;
    case 'friend_accept':
      return <UserCheck className="w-5 h-5 text-green-500" />;
    case 'message':
      return <MessageCircle className="w-5 h-5 text-purple-500" />;
    case 'post_tag':
    case 'comment_tag':
      return <AtSign className="w-5 h-5 text-orange-500" />;
    case 'follow':
      return <UserPlus className="w-5 h-5 text-blue-500" />;
    case 'story_view':
      return <Eye className="w-5 h-5 text-purple-500" />;
    case 'report':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

export default NotificationIcon;
