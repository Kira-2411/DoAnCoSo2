import axiosClient from './axiosClient';

export const foodApi = {
  // Lấy danh sách đồ ăn, nước uống (có thể lọc theo category: POPCORN, DRINK, COMBO)
  getFoods: (params = {}) => {
    return axiosClient.get('/foods', { params });
  },
};

export default foodApi;

