import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Camera,
  Sparkles,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { liveStreamApi } from '../../api/liveStreamApi';

export const StartLiveModal = ({ isOpen, onClose, currentUser }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('camera'); // 'camera' | 'screen'
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewStream, setPreviewStream] = useState(null);
  const [hasPermissionError, setHasPermissionError] = useState(false);

  const videoRef = useRef(null);

  // Khởi tạo preview camera khi modal mở
  useEffect(() => {
    let activeStream = null;

    if (isOpen) {
      setHasPermissionError(false);
      startMediaPreview();
    }

    return () => {
      stopMediaPreview();
    };
  }, [isOpen, sourceType]);

  const stopMediaPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach((t) => t.stop());
      setPreviewStream(null);
    }
  };

  const startMediaPreview = async () => {
    stopMediaPreview();
    try {
      let stream;
      if (sourceType === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      }

      setPreviewStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermissionError(false);
    } catch (err) {
      console.warn('Lỗi mở thiết bị camera/micro:', err);
      setHasPermissionError(true);
    }
  };

  const toggleMic = () => {
    if (previewStream) {
      previewStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleCamera = () => {
    if (previewStream) {
      previewStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  };

  const handleStartLive = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề cho buổi phát trực tiếp');
      return;
    }

    setLoading(true);
    try {
      const res = await liveStreamApi.create({
        title: title.trim(),
        description: description.trim(),
      });

      const stream = res.data;
      toast.success('Bắt đầu buổi phát trực tiếp! 🔴');

      // Tắt preview stream để trang broadcast tự kết nối
      stopMediaPreview();
      onClose();

      navigate(`/live/broadcast/${stream.id}`, {
        state: { sourceType, initialCameraOff: isCameraOff, initialMuted: isMuted },
      });
    } catch (err) {
      console.error('Start live error:', err);
      toast.error(err.response?.data?.message || 'Không thể tạo buổi phát trực tiếp');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/25">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Thiết lập Phát trực tiếp</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kết nối với bạn bè và cộng đồng qua video thời gian thực
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopMediaPreview();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleStartLive} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* CAMERA / SCREEN PREVIEW */}
          <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center group">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transition-transform ${
                sourceType === 'camera' ? '-scale-x-100' : ''
              } ${isCameraOff ? 'hidden' : 'block'}`}
            />

            {/* Khi tắt camera */}
            {isCameraOff && !hasPermissionError && (
              <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                <VideoOff className="w-12 h-12 mb-2 text-slate-600" />
                <p className="text-xs">Camera đang tắt</p>
              </div>
            )}

            {/* Khi không có quyền hoặc lỗi camera */}
            {hasPermissionError && (
              <div className="flex flex-col items-center justify-center text-slate-400 p-6 text-center max-w-sm">
                <AlertCircle className="w-10 h-10 mb-2 text-amber-500" />
                <p className="text-sm font-semibold text-slate-200">Chưa cấp quyền truy cập Camera/Micro</p>
                <p className="text-xs text-slate-400 mt-1">
                  Vui lòng cho phép quyền truy cập thiết bị trên trình duyệt của bạn để phát trực tiếp.
                </p>
                <button
                  type="button"
                  onClick={startMediaPreview}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-white hover:bg-slate-700 transition"
                >
                  Thử lại kết nối
                </button>
              </div>
            )}

            {/* Quick Overlaid Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 z-10">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title={isMuted ? 'Bật Mic' : 'Tắt Mic'}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isCameraOff ? 'bg-red-500 text-white' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title={isCameraOff ? 'Bật Camera' : 'Tắt Camera'}
              >
                {isCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setSourceType((prev) => (prev === 'camera' ? 'screen' : 'camera'))}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  sourceType === 'screen' ? 'bg-indigo-600 text-white' : 'bg-white/15 text-white hover:bg-white/25'
                }`}
                title="Chia sẻ màn hình / Chuyển Camera"
              >
                {sourceType === 'screen' ? <Monitor size={16} /> : <Camera size={16} />}
              </button>
            </div>
          </div>

          {/* STREAM DETAILS FORM */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tiêu đề buổi phát trực tiếp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Trò chuyện giao lưu cùng mọi người ✨"
                className="w-full px-4 py-2.5 rounded-2xl text-sm bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition"
                maxLength={100}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Mô tả (tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả nội dung hoặc chủ đề của buổi Live..."
                rows={2}
                className="w-full px-4 py-2 rounded-2xl text-sm bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition resize-none"
                maxLength={300}
              />
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                stopMediaPreview();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg shadow-red-500/25 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>Bắt đầu phát trực tiếp</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartLiveModal;
