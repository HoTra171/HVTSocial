import React, { useEffect, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Download, RotateCw, ExternalLink } from 'lucide-react';

const ImageLightbox = ({ src, alt = 'Xem ảnh', title, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setScale((prev) => Math.min(prev + 0.3, 3));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setScale((prev) => Math.max(prev - 0.3, 0.5));
  };

  const handleRotate = (e) => {
    e?.stopPropagation();
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    setScale(1);
    setRotation(0);
  };

  const handleDownload = (e) => {
    e?.stopPropagation();
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `hvtsocial_${Date.now()}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!src) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md transition-all duration-300 animate-in fade-in select-none"
    >
      {/* Top Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 to-transparent text-white z-20"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm sm:text-base text-gray-200 truncate max-w-xs sm:max-w-md">
            {title || alt}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white transition"
            title="Phóng to"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white transition"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white transition max-sm:hidden"
            title="Xoay ảnh"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white transition"
            title="Tải ảnh về máy"
          >
            <Download className="w-5 h-5" />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white transition max-sm:hidden"
            title="Mở tab mới"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white transition ml-2"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="relative flex-1 w-full flex items-center justify-center p-4 overflow-hidden"
        onDoubleClick={handleReset}
      >
        <img
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="max-h-[82vh] max-w-[92vw] object-contain rounded-lg shadow-2xl cursor-default"
        />
      </div>

      {/* Bottom Hint */}
      <div className="pb-4 text-xs text-gray-400 text-center z-10 pointer-events-none">
        Nhấn đúp chuột để đặt lại • Phím ESC hoặc bấm ra ngoài để đóng
      </div>
    </div>
  );
};

export default ImageLightbox;
