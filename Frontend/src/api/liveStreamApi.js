import axiosInstance from '../utils/axios';

export const liveStreamApi = {
  create: (data) => axiosInstance.post('/livestreams', data),
  getActive: () => axiosInstance.get('/livestreams'),
  getById: (id) => axiosInstance.get(`/livestreams/${id}`),
  end: (id) => axiosInstance.post(`/livestreams/${id}/end`),
  getUserStatus: (userId) => axiosInstance.get(`/livestreams/user/${userId}/status`),
  getComments: (id) => axiosInstance.get(`/livestreams/${id}/comments`),
  addComment: (id, content) => axiosInstance.post(`/livestreams/${id}/comments`, { content }),
};

export default liveStreamApi;
