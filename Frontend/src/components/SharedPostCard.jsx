import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Repeat2, MoreHorizontal } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const SharedPostCard = ({ post, currentUser }) => {
  const navigate = useNavigate()
  const { user, content, createdAt, originalPost } = post

  if (!originalPost) {
    return null // Không hiển thị nếu bài gốc đã bị xóa
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
      {/* Header - Người share */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={user?.profile_picture || user?.avatar || '/default.jpg'}
            alt={user?.full_name}
            className="w-10 h-10 rounded-full cursor-pointer"
            onClick={() => navigate(`/user/${user?.id}`)}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3
                className="font-semibold text-sm cursor-pointer hover:underline"
                onClick={() => navigate(`/user/${user?.id}`)}
              >
                {user?.full_name}
              </h3>
              <Repeat2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">đã chia sẻ</span>
            </div>
            <p className="text-xs text-gray-500">{dayjs(createdAt).fromNow()}</p>
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-full">
          <MoreHorizontal className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Caption của người share */}
      {content && (
        <div className="mb-3 text-sm text-gray-800">
          {content}
        </div>
      )}

      {/* Bài viết gốc */}
      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition" onClick={() => navigate(`/post/${originalPost.id}`)}>
        {/* Header bài gốc */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src={originalPost.user?.profile_picture || originalPost.user?.avatar || '/default.jpg'}
            alt={originalPost.user?.full_name}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <h4 className="font-semibold text-sm">{originalPost.user?.full_name}</h4>
            <p className="text-xs text-gray-500">{dayjs(originalPost.createdAt).fromNow()}</p>
          </div>
        </div>

        {/* Content bài gốc */}
        {originalPost.content && (
          <div className="text-sm text-gray-800 mb-2 line-clamp-3">
            {originalPost.content}
          </div>
        )}

        {/* Images bài gốc */}
        {originalPost.image_urls && originalPost.image_urls.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {originalPost.image_urls.slice(0, 3).map((img, index) => (
              <img
                key={`img-${index}`}
                src={img}
                alt=""
                className={`w-full rounded-lg object-cover ${
                  originalPost.image_urls.length === 1 ? 'max-h-64' : 'h-32'
                }`}
              />
            ))}
            {originalPost.image_urls.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{originalPost.image_urls.length - 3} ảnh khác
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SharedPostCard
