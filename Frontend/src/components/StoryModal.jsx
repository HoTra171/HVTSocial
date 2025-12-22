import React, { useState, useRef, useEffect } from 'react';
import { X, Image, Video, Music, Type, Users, Globe, Lock, Smile } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const StoryModal = ({ setShowModal, fetchStories }) => {
  const [mode, setMode] = useState('select'); // select, text, media
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  // Text story
  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [backgroundColor, setBackgroundColor] = useState('#6366f1');
  const [showFrame, setShowFrame] = useState(true);

  // Music
  const [musicFile, setMusicFile] = useState(null);
  const [musicUrl, setMusicUrl] = useState(null);
  const audioRef = useRef(null);

  // PRIVACY
  const [privacy, setPrivacy] = useState('public');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friends, setFriends] = useState([]);
  const [showFriendsList, setShowFriendsList] = useState(false);

  const [loading, setLoading] = useState(false);

  const bgColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
  ];

  //  FETCH FRIENDS FOR PRIVACY
  React.useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/friendships/friends', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setFriends(list)
      } catch (err) {
        console.error('Fetch friends error:', err);
      }
    };
    fetchFriends();
  }, []);

  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  useEffect(() => {
    return () => {
      if (musicUrl) URL.revokeObjectURL(musicUrl);
    };
  }, [musicUrl]);

  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("File không hỗ trợ");
      return;
    }

    if (mediaPreview) URL.revokeObjectURL(mediaPreview);

    setMediaFile(file);
    setMediaType(isVideo ? "video" : "image");
    setMediaPreview(URL.createObjectURL(file));
    setMode("media");
  };


  const handleMusicUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("File nhạc không hợp lệ");
      return;
    }

    setMusicFile(file);
    const url = URL.createObjectURL(file);
    setMusicUrl(url);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.load();
      audioRef.current.play().catch(() => { }); //  tránh AbortError
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => { });
    } else {
      audioRef.current.pause();
    }
  };


  const toggleFriendSelection = (friendId) => {
    const id = Number(friendId);
    if (!Number.isInteger(id) || id <= 0) return;

    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      if (mode === 'text') {
        // Text story
        await axios.post(
          'http://localhost:5000/api/stories',
          {
            media_type: 'text',
            media_url: 'text',
            expires_at: expiresAt,
            caption: textContent,
            background_color: backgroundColor,
            text_color: textColor,
            font_size: Number(fontSize),
            show_frame: showFrame,
            privacy,
            allowed_viewers: privacy === 'custom' ? selectedFriends : null,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (mode === 'media') {
        // Upload file
        const formData = new FormData();
        formData.append('file', mediaFile);

        const uploadRes = await axios.post(
          'http://localhost:5000/api/upload',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const mediaUrl = uploadRes.data.url;

        // Upload music (nếu có)
        let musicUploadUrl = null;
        if (musicFile) {
          const musicFormData = new FormData();
          musicFormData.append('file', musicFile);

          const musicUploadRes = await axios.post(
            'http://localhost:5000/api/upload',
            musicFormData,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          musicUploadUrl = musicUploadRes.data.url;
        }

        // Create story
        await axios.post(
          'http://localhost:5000/api/stories',
          {
            media_type: mediaType,
            media_url: mediaUrl,
            music_url: musicUploadUrl,
            expires_at: expiresAt,
            caption: textContent || null,
            privacy,
            allowed_viewers: privacy === 'custom' ? selectedFriends : null,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success('Đã đăng story!');
      await fetchStories();
      setShowModal(false);
    } catch (err) {
      console.error('Create story error:', err);
      toast.error(err.response?.data?.message || 'Tạo story thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-lg">Tạo Story</h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-white hover:bg-gray-800 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MODE SELECTION */}
          {mode === 'select' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('text')}
                className="w-full p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center gap-3"
              >
                <Type className="w-6 h-6" />
                <span>Tạo Story Chữ</span>
              </button>

              <label className="block w-full p-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg flex items-center justify-center gap-3 cursor-pointer">
                <Image className="w-6 h-6" />
                <span>Tạo Story Ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
              </label>

              <label className="block w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg flex items-center justify-center gap-3 cursor-pointer">
                <Video className="w-6 h-6" />
                <span>Tạo Story Video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TEXT STORY */}
          {mode === 'text' && (
            <div className="space-y-4">
              {/* Canvas */}
              <div
                className="relative w-full h-96 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ backgroundColor }}
              >
                <div
                  className={`${showFrame ? 'bg-black/30 p-4 rounded-lg' : ''}`}
                  style={{
                    color: textColor,
                    fontSize: `${fontSize}px`,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    maxWidth: '80%',
                  }}
                >
                  {textContent || 'Nhập nội dung...'}
                </div>
              </div>

              {/* Input */}
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Nhập nội dung..."
                className="w-full p-3 bg-gray-800 text-white rounded-lg resize-none"
                rows={3}
              />

              {/* Font Size */}
              <div>
                <label className="text-white text-sm mb-2 block">Cỡ chữ: {fontSize}px</label>
                <input
                  type="range"
                  min="16"
                  max="48"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Background Colors */}
              <div className="flex gap-2 flex-wrap">
                {bgColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={`w-10 h-10 rounded-full ${backgroundColor === color ? 'ring-2 ring-white' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Text Color */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTextColor('#FFFFFF')}
                  className={`w-10 h-10 rounded-full bg-white ${textColor === '#FFFFFF' ? 'ring-2 ring-indigo-500' : ''}`}
                />
                <button
                  onClick={() => setTextColor('#000000')}
                  className={`w-10 h-10 rounded-full bg-black ${textColor === '#000000' ? 'ring-2 ring-indigo-500' : ''}`}
                />
              </div>

              {/* Frame Toggle */}
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFrame}
                  onChange={(e) => setShowFrame(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Hiển thị khung</span>
              </label>

              {/* Privacy */}
              <div>
                <label className="text-white text-sm mb-2 block">Ai có thể xem?</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-white cursor-pointer p-3 bg-gray-800 rounded-lg">
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={privacy === 'public'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="w-4 h-4"
                    />
                    <Globe className="w-5 h-5" />
                    <span>Công khai</span>
                  </label>

                  <label className="flex items-center gap-3 text-white cursor-pointer p-3 bg-gray-800 rounded-lg">
                    <input
                      type="radio"
                      name="privacy"
                      value="friends"
                      checked={privacy === 'friends'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="w-4 h-4"
                    />
                    <Users className="w-5 h-5" />
                    <span>Bạn bè</span>
                  </label>

                  <label className="flex items-center gap-3 text-white cursor-pointer p-3 bg-gray-800 rounded-lg">
                    <input
                      type="radio"
                      name="privacy"
                      value="custom"
                      checked={privacy === 'custom'}
                      onChange={(e) => {
                        setPrivacy(e.target.value);
                        setShowFriendsList(true);
                      }}
                      className="w-4 h-4"
                    />
                    <Lock className="w-5 h-5" />
                    <span>Chọn bạn bè</span>
                  </label>
                </div>

                {/* Friends List */}
                {privacy === 'custom' && showFriendsList && (
                  <div className="mt-3 max-h-40 overflow-y-auto bg-gray-800 rounded-lg p-3 space-y-2">
                    {friends.map((friend) => (
                      <label key={friend.id} className="flex items-center gap-2 text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFriends.includes(friend.id)}
                          onChange={() => toggleFriendSelection(friend.id)}
                          className="w-4 h-4"
                        />
                        <img src={friend.avatar} className="w-6 h-6 rounded-full" />
                        <span className="text-sm">{friend.full_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('select')}
                  className="flex-1 p-3 bg-gray-700 text-white rounded-lg"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !textContent}
                  className="flex-1 p-3 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Đang đăng...' : 'Đăng Story'}
                </button>
              </div>
            </div>
          )}

          {/* MEDIA STORY - Tương tự text story nhưng có media preview */}
          {mode === 'media' && (
            <div className="space-y-4">
              {/* Preview with sticker */}
              <div className="relative w-full h-96 rounded-lg overflow-hidden bg-black">
                {mediaType === 'image' ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    className="w-full h-full object-contain"
                    controls
                  />
                )}
              </div>

              {/* Music - giống code cũ */}
              <div className="flex items-center gap-2">
                <label className="flex-1 p-3 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2 cursor-pointer">
                  <Music className="w-5 h-5" />
                  <span>{musicFile ? 'Đã chọn nhạc' : 'Thêm nhạc'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleMusicUpload}
                    className="hidden"
                  />
                </label>

                {musicUrl && (
                  <button
                    onClick={toggleMusic}
                    className="p-3 bg-gray-700 text-white rounded-lg"
                  >
                    {audioRef.current?.paused ? '▶️' : '⏸️'}
                  </button>
                )}
              </div>

              <audio ref={audioRef} className="hidden" />

              {/* Privacy - giống text story */}
              <div>
                <label className="text-white text-sm mb-2 block">Ai có thể xem?</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-white p-3 bg-gray-800 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="public"
                      checked={privacy === 'public'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="w-4 h-4"
                    />
                    <Globe className="w-5 h-5" />
                    <span>Công khai</span>
                  </label>

                  <label className="flex items-center gap-3 text-white p-3 bg-gray-800 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="friends"
                      checked={privacy === 'friends'}
                      onChange={(e) => setPrivacy(e.target.value)}
                      className="w-4 h-4"
                    />
                    <Users className="w-5 h-5" />
                    <span>Bạn bè</span>
                  </label>

                  <label className="flex items-center gap-3 text-white p-3 bg-gray-800 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="privacy"
                      value="custom"
                      checked={privacy === 'custom'}
                      onChange={(e) => {
                        setPrivacy(e.target.value);
                        setShowFriendsList(true);
                      }}
                      className="w-4 h-4"
                    />
                    <Lock className="w-5 h-5" />
                    <span>Chọn bạn bè</span>
                  </label>
                </div>

                {privacy === 'custom' && showFriendsList && (
                  <div className="mt-3 max-h-40 overflow-y-auto bg-gray-800 rounded-lg p-3 space-y-2">
                    {friends.map((friend) => (
                      <label key={friend.id} className="flex items-center gap-2 text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFriends.includes(friend.id)}
                          onChange={() => toggleFriendSelection(friend.id)}
                          className="w-4 h-4"
                        />
                        <img src={friend.avatar} className="w-6 h-6 rounded-full" />
                        <span className="text-sm">{friend.full_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('select')}
                  className="flex-1 p-3 bg-gray-700 text-white rounded-lg"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 p-3 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Đang đăng...' : 'Đăng Story'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryModal; 