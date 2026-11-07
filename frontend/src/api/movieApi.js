import axiosClient from './axiosClient';

export const movieApi = {
  // Lấy danh sách phim (phân trang, lọc theo status, keyword)
  getMovies: (params = {}) => {
    return axiosClient.get('/movies', { params });
  },

  // Lấy chi tiết phim theo ID
  getMovieById: (id) => {
    return axiosClient.get(`/movies/${id}`);
  },
};

export default movieApi;

