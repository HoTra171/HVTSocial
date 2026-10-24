import React from 'react';
import { X, Check, Palette } from 'lucide-react';

export const CHAT_THEMES = [
  {
    id: 'indigo',
    name: 'Lam ngọc (Mặc định)',
    bubbleClass: 'bg-indigo-600 text-white',
    gradient: 'from-indigo-600 to-indigo-700',
    colorHex: '#4f46e5',
  },
  {
    id: 'sunset',
    name: 'Hoàng hôn (Sunset)',
    bubbleClass: 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-white',
    gradient: 'from-orange-500 to-rose-600',
    colorHex: '#f43f5e',
  },
  {
    id: 'emerald',
    name: 'Lục bảo (Emerald)',
    bubbleClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
    gradient: 'from-emerald-500 to-teal-600',
    colorHex: '#10b981',
  },
  {
    id: 'violet',
    name: 'Tím mộng mơ (Violet)',
    bubbleClass: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white',
    gradient: 'from-purple-600 to-pink-500',
    colorHex: '#9333ea',
  },
  {
    id: 'sky',
    name: 'Đại dương (Ocean Blue)',
    bubbleClass: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white',
    gradient: 'from-sky-500 to-blue-600',
    colorHex: '#0284c7',
  },
  {
    id: 'midnight',
    name: 'Huyền bí (Midnight)',
    bubbleClass: 'bg-gradient-to-r from-slate-800 to-slate-950 text-white',
    gradient: 'from-slate-800 to-slate-950',
    colorHex: '#1e293b',
  },
];

export const ChatThemeModal = ({ isOpen, onClose, currentTheme, onSelectTheme }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Đổi màu đoạn chat
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3 space-y-2">
          {CHAT_THEMES.map((theme) => {
            const isSelected = (currentTheme || 'indigo') === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer border ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 font-semibold'
                    : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-tr ${theme.gradient} shadow-xs`}
                  />
                  <span className="text-sm text-slate-800 dark:text-slate-200">
                    {theme.name}
                  </span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatThemeModal;
