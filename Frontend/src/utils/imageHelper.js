/**
 * Đảm bảo URL ảnh luôn là URL đầy đủ
 * @param {string} url - URL gốc
 * @returns {string} - URL đầy đủ
 */
export const getFullImageUrl = (url) => {
  if (!url) {
    console.warn('⚠️ Image URL is empty, using default');
    return '/default.jpg';
  }

  // Nếu đã là URL đầy đủ (https://...), return ngay
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ Valid image URL:', url.substring(0, 50) + '...');
    return url;
  }

  // Nếu là relative path, chuyển thành absolute
  // (Trường hợp này không nên xảy ra với Cloudinary, nhưng cẩn thận)
  if (url.startsWith('/')) {
    console.warn('⚠️ Relative path detected:', url);
    return url;
  }

  // Nếu không có protocol, thêm https://
  console.warn('⚠️ URL without protocol, adding https://', url);
  return `https://${url}`;
};

/**
 * Log lỗi khi ảnh không load được và thay thế bằng ảnh default
 * @param {Event} e - Event object
 * @param {string} originalUrl - URL gốc
 */
export const handleImageError = (e, originalUrl) => {
  console.error('Image load error:', originalUrl);
  e.target.src = '/default.jpg';
};
