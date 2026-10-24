import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import RecentChats from '../components/RecentChats.jsx';
import BottomNav from '../components/BottomNav.jsx';
import MobileHeader from '../components/MobileHeader.jsx';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Loading from '../components/Loading.jsx';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CreatePostModal } from '../components/post/CreatePostModal.jsx';

const Layout = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const currentUserId = currentUser?.id || null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Kiểm tra đang ở trang messages hay chatbox
  const isChatPage = location.pathname.startsWith('/messages/');

  // Kiểm tra đang ở trang story
  const isStoryPage = location.pathname.startsWith('/story');

  // Check mobile
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (!authLoading && !currentUserId) {
      navigate('/');
    }
  }, [authLoading, currentUserId, navigate]);

  if (authLoading) return <Loading />;
  if (!currentUserId) return <Loading />;

  return (
    <div className="w-full min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden touch-pan-y">

      {/* ===== MOBILE HEADER (Mobile only) ===== */}
      {!isChatPage && !isStoryPage && <MobileHeader currentUserId={currentUserId} />}

      {/* ===== SIDEBAR (Desktop only - always visible) ===== */}
      <Sidebar
        currentUserId={currentUserId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenCreatePost={() => setShowCreatePostModal(true)}
      />

      {/* ===== RECENT CHATS (Visible on Chat Page) ===== */}
      {isChatPage && (
        <RecentChats
          currentUserId={currentUserId}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}


      {/* ===== MAIN CONTENT ===== */}
      <div
        className={`flex-1 relative ${isChatPage
          ? "sm:pl-20 md:pl-[20rem] min-[820px]:pl-[25rem] xl:pl-[38rem] h-screen min-h-0 overflow-hidden"
          : isStoryPage
            ? "sm:pl-20 xl:pl-72 min-h-screen overflow-y-auto" // Sidebar only
            : "sm:pl-20 xl:pl-72 min-h-screen overflow-y-auto max-sm:pt-14 max-sm:pb-16" // Sidebar only
          }`}
      >


        {/* Back chỉ khi mobile + đang mở chatbox */}
        {isMobile && location.pathname.startsWith("/messages/") && (
          <button
            className="absolute top-3 left-3 z-50 bg-white p-2 rounded-full shadow"
            onClick={() => navigate("/messages")}
          >
            <ArrowLeft size={22} />
          </button>
        )}

        <Outlet />
      </div>

      {/* ===== BOTTOM NAVIGATION (Mobile only) ===== */}
      {!isChatPage && !isStoryPage && (
        <BottomNav
          currentUserId={currentUserId}
          onOpenCreatePost={() => setShowCreatePostModal(true)}
        />
      )}

      {/* ===== GLOBAL CREATE POST MODAL (OPENS FROM SIDEBAR / BOTTOMNAV ANYWHERE) ===== */}
      {showCreatePostModal && (
        <CreatePostModal
          isOpen={showCreatePostModal}
          onClose={() => setShowCreatePostModal(false)}
          currentUser={currentUser}
          onPostCreated={(newPost) => {
            setShowCreatePostModal(false);
            window.dispatchEvent(new CustomEvent('app:post-created', { detail: newPost }));
          }}
        />
      )}

    </div>
  )
}

export default Layout


