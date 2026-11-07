import axiosClient from './axiosClient';

export const newsApi = {
  // Lấy danh sách tin tức (phân trang page, size)
  getNews: (params = {}) => {
    return axiosClient.get('/news', { params });
  },

  // Lấy chi tiết bài viết tin tức theo ID
  getNewsById: (id) => {
    return axiosClient.get(`/news/${id}`);
  },

  // Lấy danh sách mã khuyến mãi đang hoạt động (công khai)
  getActivePromotions: () => {
    return axiosClient.get('/promotions/active');
  },
};

export default newsApi;

