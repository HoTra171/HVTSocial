import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { postApi } from '../api/postApi';
import PostCard from '../components/post/PostCard';
import { PostSkeleton } from '../components/common/SkeletonLoader';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await postApi.getById(postId);
        const data = res.data?.data || res.data?.post || res.data;
        if (isMounted) {
          setPost(data);
        }
      } catch (err) {
        console.error('Fetch post detail error:', err);
        toast.error('Không tìm thấy bài viết hoặc bài viết đã bị xóa');
        if (isMounted) {
          navigate('/feed', { replace: true });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (postId) {
      fetchPost();
    }

    return () => {
      isMounted = false;
    };
  }, [postId, navigate]);

  const handlePostDeleted = () => {
    toast.success('Bài viết đã được xóa');
    navigate('/feed', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] pb-12">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Chi tiết bài viết</h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-2 sm:px-4 pt-4">
        {loading ? (
          <PostSkeleton />
        ) : post ? (
          <PostCard
            post={post}
            currentUser={currentUser}
            initialShowComments={true}
            onPostDeleted={handlePostDeleted}
          />
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-medium">Không tìm thấy nội dung bài viết</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PostDetail;
