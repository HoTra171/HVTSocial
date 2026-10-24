import React, { useEffect, useState, useRef } from 'react';
import StoriesBar from '../components/StoriesBar';
import PostCard from '../components/PostCard.jsx';
import SharedPostCard from '../components/SharedPostCard.jsx';
import { CreatePostBox } from '../components/post';
import RightSidebar from '../components/RightSidebar.jsx';
import { postApi } from '../api';
import { useAuth } from '../contexts';
import { PostSkeleton } from '../components/common/SkeletonLoader';
import { Link } from 'react-router-dom';
import {
  PenSquare,
  Compass,
  Sparkles,
  Users,
  Image as ImageIcon,
  Flame,
  ArrowUp,
  RefreshCw,
} from 'lucide-react';

const FEED_TABS = [
  { key: 'all', label: 'Dành cho bạn', icon: Sparkles },
  { key: 'friends', label: 'Bạn bè', icon: Users },
  { key: 'media', label: 'Ảnh & Video', icon: ImageIcon },
  { key: 'trending', label: 'Thịnh hành', icon: Flame },
];

const Feed = () => {
  const { currentUser } = useAuth();
  const [feeds, setFeeds] = useState([]);
  const [feedTab, setFeedTab] = useState('all'); // 'all', 'friends', 'media', 'trending'
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [openStoryTrigger, setOpenStoryTrigger] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const LIMIT = 10;

  const fetchFeeds = async (cursorToLoad = null) => {
    if (loadingMore) return;

    if (cursorToLoad === null) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await postApi.getFeed({ cursor: cursorToLoad, limit: LIMIT });
      const data = res.data;
      const newPosts = Array.isArray(data) ? data : data.posts || [];
      const nextCursor = data.nextCursor;

      if (cursorToLoad === null) {
        setFeeds(newPosts);
      } else {
        setFeeds((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNewPosts = newPosts.filter((p) => !existingIds.has(p.id));
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
      console.error('Lỗi load feed:', err);
      setHasMore(false);
    } finally {
      if (cursorToLoad === null) {
        setInitialLoading(false);
        setRefreshing(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    fetchFeeds(null);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFeeds(null);
  };

  const handlePostDeleted = (postId) => {
    setFeeds((prevFeeds) => prevFeeds.filter((post) => post.id !== postId));
  };

  const handlePostCreated = (post) => {
    if (post.replaceTempId) {
      setFeeds((prev) =>
        prev.map((p) => (p.id === post.replaceTempId ? { ...p, ...post, replaceTempId: undefined } : p))
      );
    } else {
      setFeeds((prev) => [post, ...prev]);
    }
  };

  const handlePostUpdated = (updatedPost) => {
    setFeeds((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
    );
  };

  const handleCancelUpload = (postId) => {
    setFeeds((prev) => prev.filter((p) => p.id !== postId));
  };

  // Lắng nghe sự kiện tạo bài viết từ Sidebar hoặc BottomNav toàn cục
  useEffect(() => {
    const handleGlobalPostCreated = (e) => {
      if (e.detail) {
        handlePostCreated(e.detail);
      }
    };
    window.addEventListener('app:post-created', handleGlobalPostCreated);
    return () => window.removeEventListener('app:post-created', handleGlobalPostCreated);
  }, []);

  // Scroll to top listener
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

  // Filter posts based on active tab
  const filteredFeeds = feeds.filter((post) => {
    if (feedTab === 'friends') {
      return (
        post.visibility === 'friends' ||
        post.status === 'friends' ||
        (post.user && post.user.is_friend)
      );
    }
    if (feedTab === 'media') {
      const hasImg =
        (Array.isArray(post.image_urls) && post.image_urls.length > 0) || !!post.media_url;
      return hasImg;
    }
    if (feedTab === 'trending') {
      return (Number(post.likes_count) || 0) >= 1 || (Number(post.comments_count) || 0) >= 1;
    }
    return true;
  });

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!hasMore || initialLoading || loadingMore) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loadingMore && hasMore && cursor) {
          fetchFeeds(cursor);
        }
      },
      {
        root: null,
        rootMargin: '0px 0px 250px 0px',
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
      <div className="min-h-screen flex items-start justify-center xl:justify-start xl:pl-6 2xl:pl-10 xl:gap-8 2xl:gap-10 py-6 sm:py-10 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="p-3 sm:p-4 w-full min-w-0 max-w-[680px] lg:max-w-[720px] xl:max-w-[760px] space-y-4">
          <div className="h-44 bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-100 dark:border-slate-800" />
          <div className="h-32 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800" />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center xl:justify-start xl:pl-6 2xl:pl-10 xl:gap-8 2xl:gap-10 py-4 sm:py-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="px-2 sm:px-4 w-full min-w-0 max-w-[680px] lg:max-w-[720px] xl:max-w-[760px]">
        {/* STORIES RAIL */}
        <div className="mb-4">
          <StoriesBar
            openTrigger={openStoryTrigger}
            onModalClose={() => setOpenStoryTrigger(false)}
          />
        </div>

        {/* QUICK POST CREATION BOX */}
        <CreatePostBox
          currentUser={currentUser}
          onPostCreated={handlePostCreated}
          onOpenStoryModal={() => setOpenStoryTrigger(true)}
        />

        {/* FEED FILTER TABS PILL BAR */}
        <div className="flex items-center gap-1.5 mb-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs sticky top-2 z-10">
          {FEED_TABS.map(({ key, label, icon: Icon }) => {
            const isActive = feedTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFeedTab(key)}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={15} className={isActive ? 'animate-pulse' : ''} />
                <span className="max-xs:hidden">{label}</span>
              </button>
            );
          })}

          {/* Quick Refresh Feed Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Làm mới bảng tin"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-indigo-500' : ''} />
          </button>
        </div>

        {/* POSTS STREAM */}
        <div className="space-y-5">
          {filteredFeeds.map((post) => {
            if (post.originalPost) {
              return (
                <SharedPostCard
                  post={post}
                  currentUser={currentUser}
                  key={`shared-${post.id}`}
                />
              );
            }

            return (
              <PostCard
                post={post}
                currentUser={currentUser}
                onPostDeleted={handlePostDeleted}
                onPostUpdated={handlePostUpdated}
                onCancelUpload={handleCancelUpload}
                key={`post-${post.id}`}
              />
            );
          })}

          {/* INFINITE SCROLL SENTINEL */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-6 flex items-center justify-center">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải thêm bài viết...</span>
                </div>
              ) : (
                <div className="h-4" />
              )}
            </div>
          )}

          {!hasMore && feeds.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <Sparkles size={14} className="text-amber-500" />
                <span>Bạn đã xem hết tất cả bài viết mới nhất!</span>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!initialLoading && filteredFeeds.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 text-center my-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
                <PenSquare size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                {feedTab === 'friends'
                  ? 'Chưa có bài viết nào từ bạn bè'
                  : feedTab === 'media'
                  ? 'Chưa có bài viết kèm hình ảnh hoặc video'
                  : feedTab === 'trending'
                  ? 'Chưa có bài viết thịnh hành'
                  : 'Bảng tin chưa có bài viết'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
                Hãy là người đầu tiên chia sẻ khoảnh khắc thú vị hoặc kết nối thêm bạn bè để bảng tin
                luôn rộn ràng!
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => {
                      const createBoxBtn = document.querySelector('button[type="button"][class*="rounded-full"]');
                      createBoxBtn?.click();
                    }, 100);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <PenSquare size={14} />
                  <span>Tạo bài viết ngay</span>
                </button>
                <Link
                  to="/discover"
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-2xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass size={14} />
                  <span>Khám phá cộng đồng</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR (SUGGESTIONS & CONTACTS) */}
      <RightSidebar currentUser={currentUser} />

      {/* FLOATING SCROLL TO TOP BUTTON */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-20 md:bottom-8 right-6 z-40 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer"
          title="Lên đầu trang"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default Feed;
