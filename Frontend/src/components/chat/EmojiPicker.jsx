import React, { useState } from 'react';
import { Smile, Heart, ThumbsUp, PartyPopper, Flame, Sparkles, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Mặt cười',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋',
      '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
      '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎',
      '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺',
      '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
    ],
  },
  {
    id: 'gestures',
    name: 'Cử chỉ',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '👊', '✊', '🤛',
      '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉',
      '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪',
      '🦾', '🖕', '✍️', '🙏', '🫶', '💅', '🤳', '👑', '🎉', '✨',
    ],
  },
  {
    id: 'hearts',
    name: 'Trái tim',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '💌', '💋', '🔥', '💥', '✨', '⭐', '🌟', '💫', '⚡',
    ],
  },
  {
    id: 'celebration',
    name: 'Kỷ niệm',
    icon: PartyPopper,
    emojis: [
      '🎉', '🎊', '🎈', '🎂', '🍰', '🎁', '🎀', '🪄', '🏆', '🥇',
      '🥈', '🥉', '🏅', '🎖️', '🎗️', '🎫', '🎟️', '🎪', '🎭', '🎨',
      '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🥁', '🎷', '🎸', '🎹',
    ],
  },
  {
    id: 'fun',
    name: 'Đồ vật & Đồ ăn',
    icon: Sparkles,
    emojis: [
      '☕', '🍵', '🧋', '🍺', '🍻', '🥂', '🍷', '🍕', '🍔', '🍟',
      '🌭', '🍿', '🍣', '🍜', '🍩', '🍪', '🍫', '🍬', '🍦', '🍓',
      '🚀', '✈️', '🏖️', '🏝️', '🏕️', '🎮', '🕹️', '⚽', '🏀', '💯',
    ],
  },
];

export const EmojiPicker = ({ onSelectEmoji, onClose }) => {
  const [activeTab, setActiveTab] = useState('smileys');
  const [search, setSearch] = useState('');

  const activeCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div
      className="absolute bottom-16 right-4 sm:right-16 z-50 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col transition-all animate-in fade-in zoom-in-95 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with category tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={cat.name}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Emoji Grid */}
      <div className="max-h-56 overflow-y-auto pr-1 grid grid-cols-7 sm:grid-cols-8 gap-1.5 scrollbar-thin">
        {activeCategory.emojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelectEmoji(emoji)}
            className="w-8 h-8 flex items-center justify-center text-xl hover:scale-125 active:scale-105 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Quick reaction preview bar at bottom */}
      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-lg">
        {['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉'].map((emo) => (
          <button
            key={emo}
            type="button"
            onClick={() => onSelectEmoji(emo)}
            className="p-1 hover:scale-125 transition-transform cursor-pointer"
            title={`Chèn ${emo}`}
          >
            {emo}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
