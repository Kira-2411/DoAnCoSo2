import axiosClient from './axiosClient';

export const showtimeApi = {
  // Lấy danh sách suất chiếu theo ngày (YYYY-MM-DD), movieId, roomId
  getShowtimes: (params = {}) => {
    return axiosClient.get('/showtimes', { params });
  },

  // Lấy sơ đồ ghế và trạng thái ghế của suất chiếu
  getSeatsByShowtime: (showtimeId) => {
    return axiosClient.get(`/showtimes/${showtimeId}/seats`);
  },
};

export default showtimeApi;

