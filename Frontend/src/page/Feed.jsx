import React, { useEffect, useState, useRef } from 'react';
import StoriesBar from '../components/StoriesBar';
import { assets } from '../assets/assets';
import PostCard from '../components/PostCard.jsx';
import SharedPostCard from '../components/SharedPostCard.jsx';
import { CreatePostBox } from '../components/post';
import RightSidebar from '../components/RightSidebar.jsx';
import { postApi } from '../api';
import { useAuth } from '../contexts';
import { PostSkeleton } from '../components/common/SkeletonLoader';
import { Link } from 'react-router-dom';
import { PenSquare, Compass, Sparkles, Users, Image as ImageIcon, ArrowUp } from 'lucide-react';

const Feed = () => {
  const { currentUser } = useAuth();
  const [feeds, setFeeds] = useState([]);
  const [feedTab, setFeedTab] = useState('all'); // 'all', 'friends', 'media'
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [openStoryTrigger, setOpenStoryTrigger] = useState(false);

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
      const res = await postApi.getFeed({ cursor: cursorToLoad, limit: LIMIT });

      // Handle response { posts, nextCursor }
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

  const handlePostDeleted = (postId) => {
    setFeeds((prevFeeds) => prevFeeds.filter((post) => post.id !== postId));
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredFeeds = feeds.filter((post) => {
    if (feedTab === 'friends') {
      return post.visibility === 'friends' || post.status === 'friends';
    }
    if (feedTab === 'media') {
      const hasImg = (Array.isArray(post.image_urls) && post.image_urls.length > 0) || !!post.media_url;
      return hasImg;
    }
    return true;
  });

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
    return (
      <div className="min-h-screen flex items-start justify-center xl:gap-8 py-10">
        <div className="p-4 w-full max-w-[600px] space-y-4">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-start justify-center xl:gap-8 py-10'>
      <div className="p-4 w-full max-w-[600px]">
        <StoriesBar
          openTrigger={openStoryTrigger}
          onModalClose={() => setOpenStoryTrigger(false)}
        />

        {/* Facebook-style quick post creation box */}
        <CreatePostBox
          currentUser={currentUser}
          onPostCreated={(newPost) => setFeeds((prev) => [newPost, ...prev])}
          onOpenStoryModal={() => setOpenStoryTrigger(true)}
        />

        {/* Feed Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <button
            onClick={() => setFeedTab('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              feedTab === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles size={16} />
            <span>Dành cho bạn</span>
          </button>

          <button
            onClick={() => setFeedTab('friends')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              feedTab === 'friends'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users size={16} />
            <span>Bạn bè</span>
          </button>

          <button
            onClick={() => setFeedTab('media')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              feedTab === 'media'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ImageIcon size={16} />
            <span>Ảnh & Video</span>
          </button>
        </div>

        <div className="space-y-6">
          {filteredFeeds.map((post, index) => {
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

      {/* Right Sidebar (Instagram/Facebook style: Suggestions, Online contacts, Sponsored, Footer) */}
      <RightSidebar currentUser={currentUser} />

      {/* Floating Scroll to Top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-6 z-40 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer animate-fade-in"
          title="Lên đầu trang"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default Feed;
