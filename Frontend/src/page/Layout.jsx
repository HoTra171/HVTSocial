import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import RecentChats from '../components/RecentChats.jsx'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import { Menu, X, ArrowLeft } from 'lucide-react'
import axios from 'axios'

const Layout = () => {

  // LẤY USER ID (sau này đổi auth)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  //  Kiểm tra đang ở trang messages hay chatbox
  const isChatPage = location.pathname.startsWith('/messages/')

  // Check mobile
  const isMobile = window.innerWidth < 768

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setAuthLoading(false)
      setCurrentUserId(null)
      return
    }

    axios
      .get(`${API_URL}/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const id = res.data?.user?.id ?? res.data?.id
        setCurrentUserId(id || null)
      })
      .catch((err) => {
        console.error('GET /api/auth/me error:', err)
        setCurrentUserId(null)
      })
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (!authLoading && !currentUserId) {
      navigate('/')
    }
  }, [authLoading, currentUserId, navigate])

  if (authLoading) return <Loading />
  if (!currentUserId) return <Loading />

  return (
    <div className="w-full min-h-screen flex bg-slate-50 overflow-hidden">

      {/* ===== SIDEBAR / RECENT CHATS ===== */}
      {isChatPage ? (
        <RecentChats
          currentUserId={currentUserId}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      ) : (
        <Sidebar
          currentUserId={currentUserId}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
      )}


      {/* ===== MAIN CONTENT ===== */}
      <div
        className={`flex-1 pl-120 max-sm:pl-0 relative ${isChatPage ? "h-screen min-h-0 overflow-hidden" : "min-h-screen overflow-y-auto"
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

      {/* ===== MOBILE MENU BUTTON ===== */}
      {/*  CHỈ hiển thị Menu/X khi KHÔNG /messages/:id */}
      {!isChatPage && (
        sidebarOpen ? (
          <X
            className="absolute top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : (
          <Menu
            className="absolute top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden"
            onClick={() => setSidebarOpen(true)}
          />
        )
      )}

    </div>
  )
}

export default Layout


