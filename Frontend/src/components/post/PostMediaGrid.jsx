import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { SERVER_ORIGIN } from '../../constants/api';

const toAbsoluteUrl = (u) => {
  const s = String(u || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('/')) return `${SERVER_ORIGIN}${s}`;
  return `${SERVER_ORIGIN}/${s}`;
};

export const PostMediaGrid = ({ images = [], onDoubleTapLike }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  if (!images || images.length === 0) return null;

  const validImages = images.map(toAbsoluteUrl).filter(Boolean);
  const count = validImages.length;
  if (count === 0) return null;

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : count - 1));
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev < count - 1 ? prev + 1 : 0));
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
    if (typeof onDoubleTapLike === 'function') {
      onDoubleTapLike();
    }
  };

  return (
    <>
      {/* GRID HIỂN THỊ */}
      <div
        className="mt-2 w-full overflow-hidden relative select-none"
        onDoubleClick={handleDoubleClick}
      >
        {/* Instagram Double Tap Heart Animation */}
        {showHeartAnim && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-ping duration-700">
            <div className="p-4 rounded-full bg-white/20 backdrop-blur-md shadow-2xl">
              <Heart className="w-20 h-20 text-rose-500 fill-rose-500 drop-shadow-lg" />
            </div>
          </div>
        )}

        {count === 1 && (
          <div
            className="w-full max-h-[500px] bg-slate-900 cursor-pointer flex items-center justify-center overflow-hidden"
            onClick={() => openLightbox(0)}
          >
            <img
              src={validImages[0]}
              alt=""
              className="w-full h-auto max-h-[500px] object-cover hover:opacity-95 transition-opacity"
              loading="lazy"
            />
          </div>
        )}

        {count === 2 && (
          <div className="grid grid-cols-2 gap-1 max-h-[380px]">
            {validImages.map((img, i) => (
              <div
                key={i}
                className="h-[380px] bg-slate-900 cursor-pointer overflow-hidden"
                onClick={() => openLightbox(i)}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {count === 3 && (
          <div className="grid grid-cols-2 gap-1 max-h-[420px]">
            <div
              className="h-[420px] bg-slate-900 cursor-pointer overflow-hidden"
              onClick={() => openLightbox(0)}
            >
              <img
                src={validImages[0]}
                alt=""
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </div>
            <div className="grid grid-rows-2 gap-1 h-[420px]">
              {validImages.slice(1, 3).map((img, i) => (
                <div
                  key={i}
                  className="h-[208px] bg-slate-900 cursor-pointer overflow-hidden"
                  onClick={() => openLightbox(i + 1)}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {count >= 4 && (
          <div className="grid grid-cols-2 gap-1 max-h-[420px]">
            {validImages.slice(0, 4).map((img, i) => {
              const isLast = i === 3 && count > 4;
              return (
                <div
                  key={i}
                  className="relative h-[208px] bg-slate-900 cursor-pointer overflow-hidden"
                  onClick={() => openLightbox(i)}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  {isLast && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-[2px]">
                      +{count - 4}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={closeLightbox}
        >
          {/* Nút đóng */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Nút sang trái */}
          {count > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Ảnh trung tâm */}
          <div className="max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={validImages[lightboxIndex]}
              alt=""
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Nút sang phải */}
          {count > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Chỉ số ảnh */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {count}
          </div>
        </div>
      )}
    </>
  );
};

export default PostMediaGrid;
