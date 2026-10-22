import React, { useState } from 'react';
import { CheckCircle2, Circle, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { postApi } from '../../api/postApi';

export const PostPoll = ({ poll, postId, currentUser }) => {
  const [currentPoll, setCurrentPoll] = useState(poll);
  const [loadingOptionId, setLoadingOptionId] = useState(null);

  if (!currentPoll || !Array.isArray(currentPoll.options) || currentPoll.options.length === 0) {
    return null;
  }

  const userId = currentUser?.id;

  // Tính tổng số lượt vote
  const totalVotes = currentPoll.options.reduce((sum, opt) => {
    return sum + (Array.isArray(opt.votes) ? opt.votes.length : 0);
  }, 0);

  // Xác định user đã vote cho option nào
  const userVotedOptionId = currentPoll.options.find((opt) =>
    Array.isArray(opt.votes) && opt.votes.some((vId) => Number(vId) === Number(userId))
  )?.id;

  const handleVote = async (optionId) => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập để bình chọn');
      return;
    }

    if (loadingOptionId) return;

    setLoadingOptionId(optionId);

    // Optimistic UI update
    const prevPoll = currentPoll;
    const newOptions = currentPoll.options.map((opt) => {
      const votesWithoutUser = (opt.votes || []).filter((vId) => Number(vId) !== Number(userId));
      if (opt.id === optionId) {
        return { ...opt, votes: [...votesWithoutUser, Number(userId)] };
      }
      return { ...opt, votes: votesWithoutUser };
    });

    setCurrentPoll({ ...currentPoll, options: newOptions });

    try {
      const res = await postApi.votePoll(postId, optionId);
      if (res.data?.success && res.data?.poll) {
        setCurrentPoll(res.data.poll);
      }
      toast.success('Đã ghi nhận bình chọn của bạn');
    } catch (err) {
      console.error('Vote poll error:', err);
      setCurrentPoll(prevPoll);
      toast.error(err.response?.data?.message || 'Không thể ghi nhận bình chọn');
    } finally {
      setLoadingOptionId(null);
    }
  };

  return (
    <div className="mx-4 my-3 p-4 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
      {/* Header thăm dò */}
      <div className="flex items-center gap-2 mb-3 text-slate-800 dark:text-slate-100">
        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <BarChart2 size={16} />
        </div>
        <h4 className="font-semibold text-sm">
          {currentPoll.question || 'Thăm dò ý kiến'}
        </h4>
      </div>

      {/* Danh sách các lựa chọn */}
      <div className="space-y-2.5">
        {currentPoll.options.map((option) => {
          const voteCount = Array.isArray(option.votes) ? option.votes.length : 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = option.id === userVotedOptionId;
          const isLoading = loadingOptionId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              disabled={isLoading}
              className={`w-full relative overflow-hidden rounded-xl p-3 border text-left transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-slate-900/80'
              }`}
            >
              {/* Progress bar nền hiển thị % số vote */}
              {totalVotes > 0 && (
                <div
                  className={`absolute inset-0 opacity-15 dark:opacity-25 transition-all duration-700 ease-out ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                      : 'bg-gradient-to-r from-slate-400 to-indigo-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Nội dung option */}
              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {isSelected ? (
                    <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 animate-scale-in" />
                  ) : (
                    <Circle size={18} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  )}
                  <span className={`text-xs sm:text-sm truncate ${isSelected ? 'font-bold text-indigo-900 dark:text-indigo-200' : 'font-medium text-slate-800 dark:text-slate-200'}`}>
                    {option.text}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 text-xs font-semibold">
                  <span className={isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}>
                    {percentage}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({voteCount})
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer thăm dò: Tổng lượt vote */}
      <div className="flex items-center justify-between mt-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-700/50">
        <span>{totalVotes} lượt bình chọn</span>
        {userVotedOptionId && (
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            ✓ Bạn đã tham gia bình chọn
          </span>
        )}
      </div>
    </div>
  );
};

export default PostPoll;
