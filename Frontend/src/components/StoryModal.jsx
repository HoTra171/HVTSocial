import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  Type,
  Users,
  Globe,
  Lock,
  Play,
  Pause,
  ChevronRight,
  Check,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RefreshCw,
  Upload,
  Volume2,
  Trash2,
  Smile,
  Palette,
  Eye,
  Sliders
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL, SERVER_ORIGIN } from '../constants/api';

const IG_GRADIENTS = [
  { id: 'classic', name: 'Instagram Classic', value: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' },
  { id: 'sunset', name: 'Sunset Glow', value: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' },
  { id: 'cosmic', name: 'Cosmic Purple', value: 'linear-gradient(135deg, #4158D0 0%, #C850C0 46%, #FFCC70 100%)' },
  { id: 'ocean', name: 'Ocean Aqua', value: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)' },
  { id: 'fire', name: 'Fire Ember', value: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' },
  { id: 'emerald', name: 'Emerald Forest', value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
  { id: 'neon', name: 'Neon Nights', value: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)' },
  { id: 'midnight', name: 'Midnight Dark', value: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)' },
  { id: 'royal', name: 'Royal Indigo', value: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }
];

const TEXT_STYLES = [
  { id: 'clean', name: 'Tự nhiên', className: 'text-shadow-md' },
  { id: 'frosted', name: 'Hộp mờ', className: 'bg-black/50 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-white/10' },
  { id: 'badge', name: 'Huy hiệu trắng', className: 'bg-white text-black font-extrabold px-6 py-4 rounded-2xl shadow-2xl' },
  { id: 'neon', name: 'Neon Glow', className: 'bg-purple-950/70 border-2 border-pink-400 text-pink-200 shadow-[0_0_25px_rgba(244,63,94,0.6)] px-6 py-4 rounded-2xl' },
];

const QUICK_COLORS = [
  '#FFFFFF', '#000000', '#FDE047', '#F87171', '#34D399', '#60A5FA', '#C084FC', '#F472B6'
];

const StoryModal = ({ setShowModal, fetchStories }) => {
  // Mode: 'text' or 'media'
  const [activeTab, setActiveTab] = useState('text');

  // Media state
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'

  // Text & Typography state
  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState(26);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textAlign, setTextAlign] = useState('center');
  const [textStyleIdx, setTextStyleIdx] = useState(1); // default to frosted box
  const [gradientIdx, setGradientIdx] = useState(1); // default to Sunset Glow

  // Music state
  const [musicFile, setMusicFile] = useState(null);
  const [musicUrl, setMusicUrl] = useState(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const musicInputRef = useRef(null);

  // Privacy state
  const [privacy, setPrivacy] = useState('public'); // 'public', 'friends', 'custom'
  const [friends, setFriends] = useState([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(false);

  const [loading, setLoading] = useState(false);

  // Current user info
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userAvatar = currentUser?.avatar
    ? (currentUser.avatar.startsWith('http') ? currentUser.avatar : `${SERVER_ORIGIN}${currentUser.avatar}`)
    : '/default.jpg';

  // Fetch friends for custom privacy
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_URL}/friendships/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setFriends(list);
      } catch (err) {
        console.error('Fetch friends error:', err);
      }
    };
    fetchFriends();
  }, []);

  // Cleanup object URLs
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

  // Handle media selection (image or video)
  const handleMediaUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      toast.error('Chỉ hỗ trợ file ảnh hoặc video');
      return;
    }

    if (mediaPreview) URL.revokeObjectURL(mediaPreview);

    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
    setActiveTab('media');
    toast.success(`Đã chọn ${isVideo ? 'video' : 'ảnh'}`);
  };

  // Handle music selection
  const handleMusicUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Vui lòng chọn file âm thanh (MP3, WAV,...)');
      return;
    }

    if (musicUrl) URL.revokeObjectURL(musicUrl);

    setMusicFile(file);
    const url = URL.createObjectURL(file);
    setMusicUrl(url);

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play()
        .then(() => setIsPlayingMusic(true))
        .catch(() => setIsPlayingMusic(false));
    }
    toast.success('Đã thêm bài hát vào tin!');
  };

  const toggleMusicPlay = () => {
    if (!audioRef.current || !musicUrl) return;
    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => setIsPlayingMusic(true))
        .catch(() => { });
    } else {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    }
  };

  const removeMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setMusicFile(null);
    setMusicUrl(null);
    setIsPlayingMusic(false);
  };

  const cycleGradient = () => {
    setGradientIdx((prev) => (prev + 1) % IG_GRADIENTS.length);
  };

  const cycleTextStyle = () => {
    setTextStyleIdx((prev) => (prev + 1) % TEXT_STYLES.length);
  };

  const cycleTextAlign = () => {
    const aligns = ['left', 'center', 'right'];
    const currIdx = aligns.indexOf(textAlign);
    setTextAlign(aligns[(currIdx + 1) % aligns.length]);
  };

  const toggleFriendSelection = (friendId) => {
    const id = Number(friendId);
    if (!Number.isInteger(id) || id <= 0) return;
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Publish Story
  const handleSubmit = async () => {
    if (activeTab === 'text' && !textContent.trim()) {
      toast.error('Vui lòng nhập nội dung cho tin của bạn');
      return;
    }

    if (activeTab === 'media' && !mediaFile) {
      toast.error('Vui lòng chọn ảnh hoặc video');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const currentBg = IG_GRADIENTS[gradientIdx].value;

      if (activeTab === 'text') {
        // Text story
        await axios.post(
          `${API_URL}/stories`,
          {
            media_type: 'text',
            media_url: 'text',
            expires_at: expiresAt,
            caption: textContent.trim(),
            background_color: currentBg,
            text_color: textColor,
            font_size: Number(fontSize),
            show_frame: textStyleIdx > 0,
            privacy,
            allowed_viewers: privacy === 'custom' ? selectedFriends : null,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Media story (Image / Video)
        const formData = new FormData();
        formData.append('file', mediaFile);

        const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mediaUrl = uploadRes.data.url;

        // Music upload if present
        let musicUploadUrl = null;
        if (musicFile) {
          const musicFormData = new FormData();
          musicFormData.append('file', musicFile);
          const musicUploadRes = await axios.post(`${API_URL}/upload`, musicFormData, {
            headers: { Authorization: `Bearer ${token}` },
          });
          musicUploadUrl = musicUploadRes.data.url;
        }

        await axios.post(
          `${API_URL}/stories`,
          {
            media_type: mediaType,
            media_url: mediaUrl,
            music_url: musicUploadUrl,
            expires_at: expiresAt,
            caption: textContent.trim() || null,
            background_color: currentBg,
            privacy,
            allowed_viewers: privacy === 'custom' ? selectedFriends : null,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success('Đã chia sẻ lên tin của bạn!');
      if (audioRef.current) audioRef.current.pause();
      await fetchStories();
      setShowModal(false);
    } catch (err) {
      console.error('Create story error:', err);
      toast.error(err.response?.data?.message || 'Không thể đăng tin, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter((f) =>
    (f.full_name || f.username || '').toLowerCase().includes(friendSearch.toLowerCase())
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Hidden audio element for preview */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingMusic(false)}
        className="hidden"
      />

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleMediaUpload}
        className="hidden"
      />
      <input
        ref={musicInputRef}
        type="file"
        accept="audio/*"
        onChange={handleMusicUpload}
        className="hidden"
      />

      {/* Main Instagram Story Canvas Studio */}
      <div className="relative w-full max-w-[420px] h-[720px] max-h-[94vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10 ring-1 ring-white/5 bg-slate-950">

        {/* 1. TOP TOOLBAR (Instagram Floating Header) */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 pt-5 flex items-center justify-between bg-gradient-to-b from-black/70 via-black/30 to-transparent">
          {/* Close button */}
          <button
            onClick={() => {
              if (audioRef.current) audioRef.current.pause();
              setShowModal(false);
            }}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition active:scale-95 border border-white/10 shadow-lg"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Quick Tools Icons Bar (Instagram-style Aa, Palette, Music, Stickers) */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
            {/* Aa Text Style Toggle */}
            <button
              onClick={cycleTextStyle}
              className={`p-2 rounded-full transition active:scale-90 ${
                textStyleIdx > 0 ? 'bg-white text-black font-black' : 'text-white hover:bg-white/10'
              }`}
              title={`Kiểu chữ: ${TEXT_STYLES[textStyleIdx].name}`}
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Gradient Switcher */}
            {activeTab === 'text' && (
              <button
                onClick={cycleGradient}
                className="w-7 h-7 rounded-full border-2 border-white/80 shadow-md transition active:scale-90 hover:opacity-90"
                style={{ background: IG_GRADIENTS[gradientIdx].value }}
                title={`Màu nền: ${IG_GRADIENTS[gradientIdx].name}`}
              />
            )}

            {/* Music Picker */}
            <button
              onClick={() => musicInputRef.current?.click()}
              className={`p-2 rounded-full transition active:scale-90 ${
                musicFile ? 'bg-pink-500 text-white animate-pulse' : 'text-white hover:bg-white/10'
              }`}
              title={musicFile ? 'Đổi nhạc' : 'Thêm nhạc vào tin'}
            >
              <Music className="w-4 h-4" />
            </button>

            {/* Text Alignment */}
            {activeTab === 'text' && (
              <button
                onClick={cycleTextAlign}
                className="p-2 rounded-full text-white hover:bg-white/10 transition active:scale-90"
                title="Căn lề chữ"
              >
                {textAlign === 'left' && <AlignLeft className="w-4 h-4" />}
                {textAlign === 'center' && <AlignCenter className="w-4 h-4" />}
                {textAlign === 'right' && <AlignRight className="w-4 h-4" />}
              </button>
            )}

            {/* More Text Tools Slider toggle */}
            <button
              onClick={() => setShowToolsPanel((prev) => !prev)}
              className={`p-2 rounded-full transition active:scale-90 ${
                showToolsPanel ? 'bg-indigo-600 text-white' : 'text-white hover:bg-white/10'
              }`}
              title="Tùy chỉnh cỡ chữ & màu sắc"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. STORY CANVAS AREA */}
        <div
          className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center"
          style={{
            background: activeTab === 'text' ? IG_GRADIENTS[gradientIdx].value : '#09090b',
          }}
        >
          {/* TAB 1: TEXT STORY CANVAS */}
          {activeTab === 'text' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
              {/* Floating Instagram Text Editor */}
              <div
                className={`w-full max-w-[90%] transition-all ${TEXT_STYLES[textStyleIdx].className}`}
                style={{
                  color: textStyleIdx === 2 ? '#000000' : textColor,
                  textAlign,
                }}
              >
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Nhấn để nhập văn bản..."
                  rows={4}
                  autoFocus
                  style={{
                    fontSize: `${fontSize}px`,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    color: textStyleIdx === 2 ? '#000000' : textColor,
                    textAlign,
                  }}
                  className="w-full bg-transparent border-none outline-none resize-none placeholder-white/50 caret-pink-400"
                />
              </div>

              {/* Music Sticker Badge (if attached) */}
              {musicFile && (
                <div className="absolute top-20 left-4 right-4 flex items-center justify-between bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/15 shadow-xl text-white">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <button
                      onClick={toggleMusicPlay}
                      className="w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-white shrink-0 shadow-md active:scale-90 transition"
                    >
                      {isPlayingMusic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                    <div className="truncate text-xs font-semibold">
                      <span className="text-pink-300 font-bold">🎵 {musicFile.name}</span>
                    </div>
                  </div>
                  <button
                    onClick={removeMusic}
                    className="p-1 hover:bg-white/20 rounded-full transition ml-2 text-white/70 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEDIA STORY CANVAS */}
          {activeTab === 'media' && (
            <div className="w-full h-full relative flex items-center justify-center">
              {!mediaPreview ? (
                /* Empty state: Instagram-style upload invitation */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 text-center cursor-pointer group"
                >
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 shadow-xl shadow-pink-500/20 group-hover:scale-105 transition-transform duration-300 mb-5">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white">
                      <ImageIcon className="w-10 h-10 text-pink-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Thêm ảnh hoặc video</h3>
                  <p className="text-slate-400 text-xs max-w-[220px] mb-4">
                    Nhấn vào đây để chọn tệp từ thiết bị của bạn
                  </p>
                  <span className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-md border border-white/10 transition">
                    Duyệt tệp tin
                  </span>
                </div>
              ) : (
                /* Media loaded full bleed */
                <div className="w-full h-full relative bg-black flex items-center justify-center">
                  {mediaType === 'image' ? (
                    <img
                      src={mediaPreview}
                      alt="Story Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Media Change Button */}
                  <div className="absolute top-20 right-4 z-20">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium hover:bg-black/80 flex items-center gap-1.5 border border-white/10 shadow-lg"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Đổi ảnh</span>
                    </button>
                  </div>

                  {/* Optional Text Overlay on Media */}
                  <div className="absolute bottom-24 left-4 right-4 z-20">
                    <input
                      type="text"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Thêm chú thích cho ảnh/video..."
                      className="w-full bg-black/50 backdrop-blur-md border border-white/20 rounded-full px-4 py-2.5 text-white placeholder-white/60 text-sm outline-none focus:border-pink-500 shadow-xl"
                    />
                  </div>

                  {/* Music Sticker Badge (if attached) */}
                  {musicFile && (
                    <div className="absolute top-20 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-xl text-white text-xs">
                      <button onClick={toggleMusicPlay} className="text-pink-400 hover:text-pink-300">
                        {isPlayingMusic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <span className="truncate max-w-[150px] font-medium">🎵 {musicFile.name}</span>
                      <button onClick={removeMusic} className="text-white/60 hover:text-white ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Slider & Tools Panel Overlay */}
          {showToolsPanel && (
            <div className="absolute bottom-20 left-4 right-4 z-30 p-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl text-white space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Cỡ chữ: {fontSize}px</span>
                <span className="text-pink-400 cursor-pointer" onClick={() => setFontSize(26)}>Mặc định</span>
              </div>
              <input
                type="range"
                min="16"
                max="44"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />

              {/* Color swatches */}
              <div className="pt-1">
                <span className="text-xs font-semibold text-slate-300 block mb-2">Màu chữ</span>
                <div className="flex items-center justify-between">
                  {QUICK_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTextColor(c)}
                      className={`w-7 h-7 rounded-full border transition-transform ${
                        textColor === c ? 'scale-110 border-white ring-2 ring-pink-500' : 'border-white/30'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. BOTTOM INSTAGRAM CONTROLS & PUBLISH BAR */}
        <div className="relative z-30 p-4 pb-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-3">
          {/* Mode Switcher Tabs (Chữ / Ảnh & Video) */}
          <div className="flex items-center justify-center gap-1 p-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 w-fit mx-auto shadow-md">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'text'
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Chữ</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('media');
                if (!mediaFile) fileInputRef.current?.click();
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'media'
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 text-white shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Ảnh / Video</span>
            </button>
          </div>

          {/* Action Row: Privacy Pill + Share Button */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Instagram "Tin của bạn" Privacy Button */}
            <button
              onClick={() => setShowPrivacySheet(true)}
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white backdrop-blur-md px-3.5 py-2 rounded-full border border-white/15 transition shadow-lg shrink-0"
              title="Cài đặt quyền riêng tư tin"
            >
              <div className="relative">
                <img
                  src={userAvatar}
                  alt={currentUser.full_name || 'Me'}
                  className="w-7 h-7 rounded-full object-cover border border-white/40"
                  onError={(e) => { e.currentTarget.src = '/default.jpg'; }}
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full flex items-center justify-center text-[9px] border border-black">
                  {privacy === 'public' && <Globe className="w-2.5 h-2.5 text-white" />}
                  {privacy === 'friends' && <Users className="w-2.5 h-2.5 text-white" />}
                  {privacy === 'custom' && <Lock className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
              <div className="text-left leading-tight">
                <span className="block text-[11px] font-bold text-white">Tin của bạn</span>
                <span className="block text-[9px] text-slate-300">
                  {privacy === 'public' ? 'Công khai' : privacy === 'friends' ? 'Bạn bè' : `Tùy chọn (${selectedFriends.length})`}
                </span>
              </div>
            </button>

            {/* Signature Instagram Gradient CTA Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || (activeTab === 'text' && !textContent.trim()) || (activeTab === 'media' && !mediaFile)}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-600 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-lg shadow-pink-500/25 transition-all"
            >
              <span>{loading ? 'Đang chia sẻ...' : 'Chia sẻ lên tin'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4. PRIVACY SHEET / MODAL (Overlaid Inside Canvas) */}
        {showPrivacySheet && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xl p-5 flex flex-col justify-between animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-pink-400" />
                  <span>Ai có thể xem tin của bạn?</span>
                </h3>
                <button
                  onClick={() => setShowPrivacySheet(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {/* 1. Public */}
                <div
                  onClick={() => setPrivacy('public')}
                  className={`p-3.5 rounded-2xl cursor-pointer flex items-center justify-between border transition ${
                    privacy === 'public'
                      ? 'bg-pink-500/20 border-pink-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">Công khai</p>
                      <p className="text-xs text-slate-400">Bất kỳ ai trên HVTSocial đều có thể xem</p>
                    </div>
                  </div>
                  {privacy === 'public' && <Check className="w-5 h-5 text-pink-400" />}
                </div>

                {/* 2. Friends */}
                <div
                  onClick={() => setPrivacy('friends')}
                  className={`p-3.5 rounded-2xl cursor-pointer flex items-center justify-between border transition ${
                    privacy === 'friends'
                      ? 'bg-pink-500/20 border-pink-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">Bạn bè</p>
                      <p className="text-xs text-slate-400">Chỉ những người bạn kết nối</p>
                    </div>
                  </div>
                  {privacy === 'friends' && <Check className="w-5 h-5 text-pink-400" />}
                </div>

                {/* 3. Custom / Close Friends */}
                <div
                  onClick={() => setPrivacy('custom')}
                  className={`p-3.5 rounded-2xl cursor-pointer flex items-center justify-between border transition ${
                    privacy === 'custom'
                      ? 'bg-pink-500/20 border-pink-500/50 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">Bạn thân / Tùy chọn</p>
                      <p className="text-xs text-slate-400">Chỉ định những ai được xem tin này</p>
                    </div>
                  </div>
                  {privacy === 'custom' && <Check className="w-5 h-5 text-pink-400" />}
                </div>
              </div>

              {/* Friends list picker when custom */}
              {privacy === 'custom' && (
                <div className="mt-4 pt-3 border-t border-white/10">
                  <input
                    type="text"
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder="Tìm kiếm bạn bè..."
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white placeholder-white/50 text-xs outline-none mb-2"
                  />
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {filteredFriends.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Không tìm thấy bạn bè nào</p>
                    ) : (
                      filteredFriends.map((friend) => {
                        const isSelected = selectedFriends.includes(friend.id);
                        return (
                          <div
                            key={friend.id}
                            onClick={() => toggleFriendSelection(friend.id)}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                              isSelected ? 'bg-pink-500/20 text-white' : 'hover:bg-white/5 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={friend.avatar || '/default.jpg'}
                                className="w-7 h-7 rounded-full object-cover"
                                onError={(e) => { e.currentTarget.src = '/default.jpg'; }}
                              />
                              <span className="text-xs font-medium">{friend.full_name || friend.username}</span>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? 'bg-pink-500 border-pink-500 text-white' : 'border-white/30'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowPrivacySheet(false)}
              className="w-full mt-4 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs shadow-lg active:scale-95 transition"
            >
              Xác nhận
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default StoryModal;