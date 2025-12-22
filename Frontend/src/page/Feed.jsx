import React, { useEffect, useState, useRef } from 'react';
import StoriesBar from '../components/StoriesBar';
import { assets } from '../assets/assets';
import Loading from '../components/Loading.jsx';
import PostCard from '../components/PostCard.jsx';
import RecentMessages from '../components/RecentMessages.jsx';
import axios from "axios";

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const LIMIT = 10; // số post / trang

  const fetchFeeds = async (pageToLoad = 1) => {
    // nếu đang load thêm hoặc không còn dữ liệu thì thôi
    if (pageToLoad !== 1 && (loadingMore || !hasMore)) return;

    // phân biệt load lần đầu vs load thêm
    if (pageToLoad === 1) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/posts", {
        params: { page: pageToLoad, limit: LIMIT },
        headers: { Authorization: `Bearer ${token}` },
      });

      const newPosts = res.data || [];

      if (pageToLoad === 1) {
        // lần đầu hoặc refresh
        setFeeds(newPosts);
      } else {
        // nối thêm vào cuối
        setFeeds((prev) => [...prev, ...newPosts]);
      }

      // kiểm tra còn data không
      if (newPosts.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setPage(pageToLoad);
      }
    } catch (err) {
      console.error("Lỗi load feed:", err);
    } finally {
      if (pageToLoad === 1) {
        setInitialLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // load trang 1 khi vừa vào
  useEffect(() => {
    fetchFeeds(1);
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
    if (!hasMore || initialLoading) return;

    // clear observer cũ nếu có
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loadingMore && hasMore) {
          // đang thấy element sentinel -> gọi page tiếp theo
          fetchFeeds(page + 1);
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
  }, [page, hasMore, loadingMore, initialLoading]);

  if (initialLoading) {
    return <Loading />;
  }

  const handlePostDeleted = (postId) => {
    setFeeds((prevFeeds) => prevFeeds.filter((post) => post.id !== postId));
  };

  return (
    <div className='min-h-screen flex items-start justify-center xl:gap-8 sm:-ml-60 py-10'>
      <div className="p-4 w-full max-w-[600px]">
        <StoriesBar />

        <div className="space-y-6">
          {feeds.map((post, index) => (
            <PostCard post={post}
              currentUser={currentUser}
              onPostDeleted={handlePostDeleted}
              key={`post-${post.id}`} />
          ))}

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
