import React, { useEffect, useState, useRef } from 'react';
import StoriesBar from '../components/StoriesBar';
import { assets } from '../assets/assets';
import Loading from '../components/Loading.jsx';
import PostCard from '../components/PostCard.jsx';
import SharedPostCard from '../components/SharedPostCard.jsx';
import RecentMessages from '../components/RecentMessages.jsx';
import axios from "axios";
import { API_URL, SERVER_ORIGIN } from '../constants/api';
import { Link } from 'react-router-dom';
import { PenSquare, Compass } from 'lucide-react';

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const LIMIT = 10; // số post / trang

  const fetchFeeds = async (cursorToLoad = null) => {
    // Prevent duplicate calls
    if (loadingMore) return;

    if (cursorToLoad === null) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/posts`, {
        params: { cursor: cursorToLoad, limit: LIMIT },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle new response { posts, nextCursor }
      const data = res.data;
      const newPosts = Array.isArray(data) ? data : (data.posts || []);
      const nextCursor = data.nextCursor;

      if (cursorToLoad === null) {
        // Initial load or refresh
        setFeeds(newPosts);
      } else {
        // Append
        setFeeds((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      }

      if (!nextCursor || newPosts.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setCursor(nextCursor);
      }
    } catch (err) {
      console.error("Lỗi load feed:", err);
      setHasMore(false);
    } finally {
      if (cursorToLoad === null) {
        setInitialLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // load trang 1 khi vừa vào
  useEffect(() => {
    fetchFeeds(null);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch (e) {
        console.error("Parse user error:", e);
      }
    }
  }, []);

  // IntersectionObserver để auto load thêm khi scroll gần cuối
  useEffect(() => {
    if (!hasMore || initialLoading || loadingMore) return;

    // clear observer cũ nếu có
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loadingMore && hasMore && cursor) {
          // đang thấy element sentinel -> gọi page tiếp theo
          fetchFeeds(cursor);
        }
      },
      {
        root: null,         // viewport hiện tại
        rootMargin: '0px 0px 200px 0px', // chạm trước 200px là load
        threshold: 0.1,
      }
    );

    const current = loadMoreRef.current;
    if (current) {
      observerRef.current.observe(current);
    }

    return () => {
      if (observerRef.current && current) {
        observerRef.current.unobserve(current);
      }
    };
  }, [cursor, hasMore, loadingMore, initialLoading]);

  if (initialLoading) {
    return <Loading />;
  }

  const handlePostDeleted = (postId) => {
    setFeeds((prevFeeds) => prevFeeds.filter((post) => post.id !== postId));
  };

  return (
    <div className='min-h-screen flex items-start justify-center xl:gap-8 py-10'>
      <div className="p-4 w-full max-w-[600px]">
        <StoriesBar />

        <div className="space-y-6">
          {feeds.map((post, index) => {
            // Nếu post có originalPost thì đây là bài share
            if (post.originalPost) {
              return (
                <SharedPostCard
                  post={post}
                  currentUser={currentUser}
                  key={`shared-${post.id}`}
                />
              )
            }

            // Bài viết thường
            return (
              <PostCard
                post={post}
                currentUser={currentUser}
                onPostDeleted={handlePostDeleted}
                key={`post-${post.id}`}
              />
            )
          })}

          {/* sentinel để IntersectionObserver bắt khi scroll gần cuối */}
          {hasMore && (
            <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
              {loadingMore && (
                <span className="text-xs text-slate-400">
                  Đang tải thêm...
                </span>
              )}
            </div>
          )}

          {!hasMore && feeds.length > 0 && (
            <p className="text-center text-xs text-slate-400 mt-4">
              Bạn đã xem hết bài viết.
            </p>
          )}

          {!initialLoading && feeds.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 text-center my-6">
              <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
                <PenSquare size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                Chưa có bài viết nào trên bảng tin
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                Hãy là người đầu tiên chia sẻ khoảnh khắc thú vị hoặc kết nối thêm bạn bè để bảng tin luôn rộn ràng!
              </p>
              <div className="flex items-center gap-3">
                <Link
                  to="/create-post"
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-1.5"
                >
                  <PenSquare size={14} /> Tạo bài viết ngay
                </Link>
                <Link
                  to="/discover"
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all hover:scale-105 flex items-center gap-1.5"
                >
                  <Compass size={14} /> Khám phá bạn bè
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-xl:hidden w-72 flex-shrink-0">
        <div className="sticky top-10 self-start flex flex-col gap-4">
          <div className="max-w-xs bg-white text-xs p-4 rounded-md inline-flex flex-col gap-2 shadow">
            <h3 className="text-slate-800 font-semibold">Sponsored</h3>
            <img
              src={assets.sponsored_img}
              alt=""
              className="w-full h-48 rounded-md object-cover"
            />
            <p className="text-slate-600">Email marketing</p>
            <p className='text-slate-400 text-sm'>
              Supercharge your marketing with a powerful, easy-to-use platform built for results.
            </p>
          </div>

          <RecentMessages />
        </div>
      </div>
    </div>
  );
};

export default Feed;
