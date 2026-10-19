import axiosInstance from '../utils/axios';

export const uploadApi = {
  /**
   * Tải tệp lên hệ thống (ảnh, video, audio)
   * @param {File} file
   * @param {Function} [onUploadProgress]
   */
  uploadFile: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  /**
   * Tải nhiều tệp lên
   * @param {File[]} files
   * @param {Function} [onUploadProgress]
   */
  uploadMultiple: (files, onUploadProgress) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    return axiosInstance.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
};

export default uploadApi;
