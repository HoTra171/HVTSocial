import { useEffect, useState, useRef } from "react";
import { CircleArrowRight, Plus } from "lucide-react";
import StoryModal from "./StoryModal.jsx";
import StoryViewer from "./StoryViewer.jsx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import axios from "axios";
import "dayjs/locale/vi";
import { ArrowLeft, ArrowRight } from "lucide-react";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const StoriesBar = () => {
  const [stories, setStories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewStory, setViewStory] = useState(null);

  const containerRef = useRef(null); // Khung scroll ngang
  const listRef = useRef(null); // Hàng story (để đo kích thước 1 card + gap)

  const [showLeftBtn, setShowLeftBtn] = useState(false); // Ẩn nút trái khi đang ở đầu danh sách
  const [showRightBtn, setShowRightBtn] = useState(true); // Ẩn nút phải khi đã cuộn tới cuối


  const fetchStories = async () => {
    // Không gọi API nếu chưa có token (tránh 401)
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5000/api/stories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStories(res.data);
      requestAnimationFrame(() => requestAnimationFrame(updateNavButtons));
    } catch (err) {
      console.error(err);
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

    // Tự làm mới stories mỗi 5 phút để UI luôn cập nhật
    const interval = setInterval(fetchStories, 5 * 60 * 1000);

    updateNavButtons();
    window.addEventListener("resize", updateNavButtons);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateNavButtons);
    };
  }, []);


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
          <div className="flex gap-4 pb-5 min-w-max" ref={listRef}>
            {/* Tạo story mới */}
            <div
              onClick={() => setShowModal(true)}
              className="rounded-xl min-w-[110px] h-[180px] aspect-[3/5] border-dashed border-2 border-indigo-300 cursor-pointer flex flex-col items-center justify-center gap-3 hover:bg-indigo-50 transition"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                <Plus className="text-white" size={20} />
              </div>
              <p className="text-sm font-medium">Tạo Story</p>
            </div>

            {/* Danh sách preview story theo user */}
            {stories.map((group) => {
              const previewStory = group.stories[0];
              if (!previewStory) return null;

              return (
                <div
                  key={group.user.id} // Key ổn định theo user
                  onClick={() =>
                    setViewStory({
                      user: group.user,
                      stories: group.stories,
                      currentIndex: 0,
                    })
                  }
                  className="relative rounded-xl min-w-[110px] h-[180px] aspect-[3/5] overflow-hidden cursor-pointer bg-gradient-to-b from-indigo-500 to-purple-600 hover:scale-105 transition-transform"
                >
                  {/* Avatar người đăng */}
                  <img
                    src={group.user.avatar ||
                      `/default.jpg`
                    }
                    alt=""
                    className="absolute top-2 left-2 w-10 h-10 rounded-full ring-2 ring-white z-10"
                  />

                  {/* Nội dung story preview */}
                  {previewStory.media_type === "text" ? (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-white p-3 text-sm text-center font-medium"
                      style={{ backgroundColor: previewStory.background_color }}
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
          <StoryModal setShowModal={setShowModal} fetchStories={fetchStories} />
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
