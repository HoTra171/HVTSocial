import React, { useEffect, useState } from 'react';
import { Bookmark, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { postApi } from '../api/postApi';
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';

export const SavedPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    postApi
      .getSavedPosts()
      .then((res) => {
        if (mounted) {
          const list = res.data?.data || res.data?.posts || res.data || [];
          setPosts(Array.isArray(list) ? list : []);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải bài viết đã lưu:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handlePostUnsaved = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
          <Bookmark className="w-5 h-5 fill-indigo-600" />
        </div>

        <div>
          <h1 className="text-lg font-bold text-gray-900">Bài viết đã lưu</h1>
          <p className="text-xs text-gray-500">
            {posts.length > 0
              ? `Bạn có ${posts.length} bài viết trong bộ sưu tập đã lưu`
              : 'Lưu các bài viết yêu thích để xem lại bất cứ lúc nào'}
          </p>
        </div>
      </div>

      {/* DANH SÁCH BÀI VIẾT ĐÃ LƯU */}
      {loading ? (
        <div className="py-16 text-center">
          <Loading />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 max-w-md mx-auto mt-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Chưa có bài viết nào được lưu
          </h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Nhấn vào biểu tượng dấu trang ở góc dưới mỗi bài viết trên Bảng tin để lưu lại xem sau.
          </p>
          <button
            onClick={() => navigate('/feed')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Khám phá Bảng tin</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUnsaved={handlePostUnsaved}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPosts;
