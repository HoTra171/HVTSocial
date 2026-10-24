import { useEffect, useState, useRef } from "react";
import { CircleArrowRight, Plus, Radio, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StoryModal from "./StoryModal.jsx";
import StoryViewer from "./StoryViewer.jsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import axios from "axios";
import "dayjs/locale/vi";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { API_URL, SERVER_ORIGIN } from '../constants/api';
import { liveStreamApi } from '../api/liveStreamApi';
import { useSocket } from '../contexts';

dayjs.extend(relativeTime);
dayjs.locale("vi");

const StoriesBar = ({ openTrigger = false, onModalClose }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [stories, setStories] = useState([]);
  const [activeLiveStreams, setActiveLiveStreams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setViewStory] = useState(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);

  useEffect(() => {
    if (openTrigger) {
      setShowModal(true);
    }
  }, [openTrigger]);

  const currentUserIdVal = JSON.parse(localStorage.getItem("user") || "{}")?.id;

  const containerRef = useRef(null); // Khung scroll ngang
  const listRef = useRef(null); // Hàng story (để đo kích thước 1 card + gap)

  const [showLeftBtn, setShowLeftBtn] = useState(false); // Ẩn nút trái khi đang ở đầu danh sách
  const [showRightBtn, setShowRightBtn] = useState(true); // Ẩn nút phải khi đã cuộn tới cuối


  const fetchStories = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/stories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStories(res.data);
      requestAnimationFrame(() => requestAnimationFrame(updateNavButtons));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActiveLiveStreams = async () => {
    try {
      const res = await liveStreamApi.getActive();
      if (res.data) {
        setActiveLiveStreams(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Error fetching livestreams:', err);
    }
  };

  const updateNavButtons = () => {
    // Cập nhật hiển thị nút trái/phải dựa theo vị trí scroll
    const el = containerRef.current;
    if (!el) return;

    const tolerance = 1; // chống sai số pixel
    const atStart = el.scrollLeft <= 0;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - tolerance;

    setShowLeftBtn(!atStart);
    setShowRightBtn(!atEnd);
  };


  // Cuộn đúng 1 "story-card" mỗi lần bấm (giống Facebook)
  const scrollByOneCard = (direction) => {
    const container = containerRef.current;
    const list = listRef.current;
    if (!container || !list) return;

    const firstCard = list.children?.[0];
    if (!firstCard) return;

    const cardWidth = firstCard.getBoundingClientRect().width;

    // Đo gap thật giữa các card để cuộn chính xác 1 bước
    const styles = window.getComputedStyle(list);
    const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;

    const step = cardWidth + gap;

    container.scrollBy({
      left: direction === "right" ? step : -step,
      behavior: "smooth",
    });

    requestAnimationFrame(updateNavButtons);
  };

  useEffect(() => {
    fetchStories();
    fetchActiveLiveStreams();

    const interval = setInterval(() => {
      fetchStories();
      fetchActiveLiveStreams();
    }, 2 * 60 * 1000);

    updateNavButtons();
    window.addEventListener("resize", updateNavButtons);

    // Socket realtime live updates
    if (socket) {
      const handleNewLive = (stream) => {
        setActiveLiveStreams((prev) => [stream, ...prev.filter((s) => s.id !== stream.id)]);
      };
      const handleEndLive = ({ streamId }) => {
        setActiveLiveStreams((prev) => prev.filter((s) => s.id !== streamId));
      };
      socket.on('new_livestream_started', handleNewLive);
      socket.on('user_livestream_ended', handleEndLive);

      return () => {
        clearInterval(interval);
        window.removeEventListener("resize", updateNavButtons);
        socket.off('new_livestream_started', handleNewLive);
        socket.off('user_livestream_ended', handleEndLive);
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateNavButtons);
    };
  }, [socket]);


  return (
    <div className="w-full flex justify-center">
      {/* Wrapper để đặt nút trái/phải đè lên thanh stories */}
      <div className="relative max-w-2xl w-full">
        {/* Nút trái: chỉ hiện khi đã scroll sang phải */}
        {showLeftBtn && (
          <button
            type="button"
            onClick={() => scrollByOneCard("left")}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 px-2 py-2 rounded-full bg-white/80 shadow"
            aria-label="Lùi lại"
          >
            <ArrowLeft />
          </button>
        )}

        {/* Nút phải: tới user kế tiếp trong thanh stories */}
        {showRightBtn && (
          <button
            type="button"
            onClick={() => scrollByOneCard("right")}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 px-2 py-2 rounded-full bg-white/80 shadow"
            aria-label="Tiếp theo"
          >
            <ArrowRight />
          </button>
        )}

        <div
          className="w-full overflow-x-auto no-scrollbar"
          ref={containerRef}
          onScroll={updateNavButtons} // Theo dõi scroll để ẩn/hiện nút trái/phải đúng lúc
        >
          <div className="flex gap-3 pb-4 min-w-max" ref={listRef}>
            {/* Tạo story mới (Facebook / Instagram Style) */}
            <div
              onClick={() => setShowModal(true)}
              className={`relative rounded-2xl min-w-[110px] w-[110px] h-[190px] overflow-hidden cursor-pointer bg-white dark:bg-slate-900 border shadow-sm flex flex-col hover:shadow-md transition-all group ${
                isUploadingStory ? 'border-indigo-500 ring-2 ring-indigo-400/40 animate-pulse' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="w-full h-[130px] overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                <img
                  src={JSON.parse(localStorage.getItem("user") || "{}")?.avatar || "/default.jpg"}
                  alt="User"
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                    isUploadingStory ? 'opacity-70 blur-[1px]' : ''
                  }`}
                  onError={(e) => { e.currentTarget.src = '/default.jpg'; }}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

                {isUploadingStory && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Overlaid + button */}
              <div className="absolute top-[112px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Plus className="text-white" size={16} />
              </div>

              <div className="flex-1 flex items-end justify-center pb-2 pt-3 px-1 text-center">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  {isUploadingStory ? 'Đang tải lên...' : 'Tạo tin'}
                </p>
              </div>
            </div>

            {/* DANH SÁCH PHÒNG LIVE STREAM ĐANG PHÁT (TRỰC TIẾP) */}
            {activeLiveStreams.map((stream) => (
              <div
                key={`livestream-${stream.id}`}
                onClick={() => navigate(`/live/${stream.id}`)}
                className="relative rounded-2xl min-w-[110px] w-[110px] h-[190px] overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:scale-[1.03] transition-all bg-gradient-to-b from-rose-600 to-red-700 ring-2 ring-red-500 animate-pulse group"
              >
                <img
                  src={stream.user?.avatar || stream.thumbnail_url || '/default.jpg'}
                  alt={stream.user?.full_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = '/default.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />

                {/* Badge TRỰC TIẾP */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] shadow-sm tracking-wider">
                  <Radio size={10} className="animate-spin" />
                  <span>TRỰC TIẾP</span>
                </div>

                {/* Viewer count */}
                <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold flex items-center gap-1">
                  <Eye size={10} />
                  <span>{stream.viewer_count || 0}</span>
                </div>

                {/* Info bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                  <p className="text-white text-xs font-bold truncate leading-tight">
                    {stream.user?.full_name}
                  </p>
                  <p className="text-white/80 text-[10px] truncate mt-0.5">
                    {stream.title}
                  </p>
                </div>
              </div>
            ))}

            {/* Danh sách preview story theo user */}
            {[...stories].sort((a, b) => {
              if (a.user.id === currentUserIdVal) return -1;
              if (b.user.id === currentUserIdVal) return 1;

              const aHasUnseen = a.stories.some(s => !s.is_viewed);
              const bHasUnseen = b.stories.some(s => !s.is_viewed);
              if (aHasUnseen && !bHasUnseen) return -1;
              if (!aHasUnseen && bHasUnseen) return 1;

              return 0;
            }).map((group) => {
              const previewStory = group.stories[0];
              if (!previewStory) return null;

              const hasUnseenStories = group.stories.some(s => !s.is_viewed && group.user.id !== currentUserIdVal);

              return (
                <div
                  key={group.user.id}
                  onClick={() =>
                    setViewStory({
                      user: group.user,
                      stories: group.stories,
                      currentIndex: 0,
                    })
                  }
                  className="relative rounded-2xl min-w-[110px] w-[110px] h-[190px] overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all bg-gradient-to-b from-indigo-500 to-purple-600 group"
                >
                  {/* Avatar người đăng with Instagram-style gradient ring */}
                  <div
                    className={`absolute top-2.5 left-2.5 p-[2px] rounded-full z-10 transition-transform group-hover:scale-105 ${
                      hasUnseenStories
                        ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-sm"
                        : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <img
                      src={group.user.avatar || `/default.jpg`}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                      onError={(e) => { e.currentTarget.src = '/default.jpg'; }}
                    />
                  </div>

                  {/* Nội dung story preview */}
                  {previewStory.media_type === "text" ? (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-white p-3 text-sm text-center font-medium"
                      style={{ background: previewStory.background_color || '#6366f1' }}
                    >
                      {previewStory.caption}
                    </div>
                  ) : previewStory.media_type === "image" ? (
                    <img
                      src={previewStory.media_url}
                      alt=""
                      className="w-full h-full object-cover opacity-90"
                    />
                  ) : (
                    <video
                      src={previewStory.media_url}
                      preload="metadata" // Giảm tải dữ liệu video khi chỉ cần preview
                      className="w-full h-full object-cover opacity-90"
                    />
                  )}

                  {/* Sticker (nếu có) */}
                  {previewStory.sticker && (
                    <div className="absolute bottom-12 right-2 text-2xl">
                      {previewStory.sticker}
                    </div>
                  )}

                  {/* Tên + thời gian đăng */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-xs font-medium truncate">
                      {group.user.full_name}
                    </p>
                    <p className="text-white/70 text-xs">
                      {dayjs(previewStory.created_at).fromNow()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal tạo story */}
        {showModal && (
          <StoryModal
            setShowModal={(val) => {
              setShowModal(val);
              if (!val && onModalClose) onModalClose();
            }}
            fetchStories={fetchStories}
            onUploadStart={() => setIsUploadingStory(true)}
            onUploadEnd={() => setIsUploadingStory(false)}
          />
        )}

        {/* Viewer story */}
        {viewStory && (
          <StoryViewer
            viewStory={viewStory}
            setViewStory={setViewStory}
            allStories={stories}
          />
        )}
      </div>
    </div>
  );
};

export default StoriesBar;
