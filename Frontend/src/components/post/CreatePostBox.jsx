import React, { useState } from 'react';
import { Image, Smile, Sparkles, BarChart2, Radio } from 'lucide-react';
import { CreatePostModal } from './CreatePostModal';
import { StartLiveModal } from '../livestream/StartLiveModal';

export const CreatePostBox = ({ currentUser, onPostCreated, onOpenStoryModal }) => {
  const [showModal, setShowModal] = useState(false);
  const [openWithPoll, setOpenWithPoll] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);

  const firstName = currentUser?.full_name?.split(' ').pop() || 'bạn';

  const handleOpenModal = (withPoll = false) => {
    setOpenWithPoll(withPoll);
    setShowModal(true);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 mb-6 transition-all hover:shadow-md">
        {/* Top: Avatar & Input button */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <img
            src={currentUser?.avatar || currentUser?.profile_picture || '/default.jpg'}
            alt={currentUser?.full_name || 'User'}
            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition"
            onError={(e) => {
              e.currentTarget.src = '/default.jpg';
            }}
          />
          <button
            type="button"
            onClick={() => handleOpenModal(false)}
            className="flex-1 text-left px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs sm:text-sm rounded-full transition cursor-pointer select-none"
          >
            {`${firstName} ơi, bạn đang nghĩ gì thế?`}
          </button>
        </div>

        {/* Bottom: Quick Action Shortcuts */}
        <div className="flex items-center justify-between pt-2 gap-1 overflow-x-auto no-scrollbar">
          {/* Phát trực tiếp (Live Stream) */}
          <button
            type="button"
            onClick={() => setShowLiveModal(true)}
            className="flex-1 min-w-[75px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold transition cursor-pointer"
          >
            <span className="text-red-500 animate-pulse">
              <Radio size={18} />
            </span>
            <span className="hidden sm:inline">Phát trực tiếp</span>
          </button>

          {/* Ảnh / Video */}
          <button
            type="button"
            onClick={() => handleOpenModal(false)}
            className="flex-1 min-w-[75px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <span className="text-emerald-500">
              <Image size={18} />
            </span>
            <span className="hidden sm:inline">Ảnh / Video</span>
          </button>

          {/* Thăm dò ý kiến / Khảo sát */}
          <button
            type="button"
            onClick={() => handleOpenModal(true)}
            className="flex-1 min-w-[75px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <span className="text-indigo-500">
              <BarChart2 size={18} />
            </span>
            <span className="hidden sm:inline">Khảo sát</span>
          </button>

          {/* Cảm xúc / Hoạt động */}
          <button
            type="button"
            onClick={() => handleOpenModal(false)}
            className="flex-1 min-w-[75px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <span className="text-amber-500">
              <Smile size={18} />
            </span>
            <span className="hidden sm:inline">Cảm xúc</span>
          </button>

          {/* Tạo tin nhanh (Story) */}
          <button
            type="button"
            onClick={onOpenStoryModal}
            className="flex-1 min-w-[75px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            <span className="text-purple-500">
              <Sparkles size={18} />
            </span>
            <span className="hidden sm:inline">Tạo tin</span>
          </button>
        </div>
      </div>

      {/* Modal tạo bài viết */}
      <CreatePostModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setOpenWithPoll(false);
        }}
        currentUser={currentUser}
        onPostCreated={onPostCreated}
        initialPollOpen={openWithPoll}
      />

      {/* Modal phát trực tiếp (Live Stream) */}
      <StartLiveModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        currentUser={currentUser}
      />
    </>
  );
};

export default CreatePostBox;
