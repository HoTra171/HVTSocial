import { Verified, MapPin, Calendar, PenBox } from "lucide-react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const UserProfileInfo = ({ user, posts = [], profileId, setShowEdit }) => {
  const navigate = useNavigate();
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    currentUser = null;
  }
  // Xác định có phải đang xem profile của chính mình không
  const isOwnProfile =
    !profileId || Number(currentUser?.id) === Number(user?.id);

  return (
    <div className="relative py-4 px-6 md:px-8 bg-white">
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Avatar */}
        <div className="w-32 h-32 border-4 border-white shadow-lg absolute -top-16 rounded-full overflow-hidden">
          <img
            src={
              user.avatar ||
              `/default.jpg`
            }
            alt="avatar"
            className="w-full h-full object-cover rounded-full"
          />

        </div>

        <div className="w-full pt-16 md:pt-0 md:pl-36">
          <div className="flex flex-col md:flex-row items-start justify-between gap-3">
            {/* Name + username */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.full_name || "Chưa có tên"}
                </h1>
                <Verified className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-gray-600">
                {user.username ? `@${user.username}` : "Thêm tên người dùng"}
              </p>
            </div>

            {/* Chỉ hiện buttons khi là profile của chính mình */}
            {isOwnProfile && (
              <div className="flex flex-row gap-3">
                {/* Edit button */}
                <button
                  onClick={() => setShowEdit?.(true)}
                  className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium mt-4 md:mt-0"
                >
                  <PenBox className="w-4 h-4" />
                  Chỉnh sửa
                </button>

                {/* Đổi mật khẩu - Hidden on mobile */}
                <button
                  onClick={() => navigate("/change-password")}
                  className="max-sm:hidden flex items-center gap-2 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium mt-4 md:mt-0"
                >
                  Đổi mật khẩu
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          <p className="text-gray-700 text-sm max-w-md mt-4">
            {user.bio || "Chưa có tiểu sử"}
          </p>

          {/* Location + joined time */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 mt-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              {user.address || "Chưa có địa chỉ"}
            </span>

            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Tham gia{" "}
              <span className="font-medium">
                {user.created_at
                  ? dayjs(user.created_at).fromNow()
                  : "không rõ"}
              </span>
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6 border-t border-gray-200 pt-4">
            <div>
              <span className="sm:text-xl font-bold text-gray-900">
                {posts.length}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 ml-1.5">
                Bài viết
              </span>
            </div>

            {/* <div>
              <span className="sm:text-xl font-bold text-gray-900">
                {followersCount}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 ml-1.5">
                Bạn bè
              </span>
            </div> */}

            {/* <div>
              <span className="sm:text-xl font-bold text-gray-900">
                {followingCount}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 ml-1.5">
                Following
              </span>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileInfo;