/**
 * DỊCH VỤ API CHO TRANG QUẢN TRỊ (ADMIN)
 * 
 * CHÚ Ý: Đây là DỮ LIỆU GIẢ trong bộ nhớ (in-memory mock).
 * Không kết nối mạng thật và không lưu vào localStorage.
 * Trên mỗi hàm có ghi chú endpoint thật tương ứng trong `docs/API.md`.
 * Khi backend hoàn thiện, chỉ cần thay phần logic mock bằng gọi `axiosClient`.
 */

import {
  INITIAL_MOVIES,
  INITIAL_ROOMS,
  INITIAL_SHOWTIMES,
  INITIAL_FOODS,
  INITIAL_PROMOTIONS,
  INITIAL_NEWS,
  INITIAL_USERS,
  calculateEndTime,
} from '../mocks/adminMockData';
import axiosClient from './axiosClient';

// Kho dữ liệu lưu trong bộ nhớ (sao chép độc lập)
let moviesDb = JSON.parse(JSON.stringify(INITIAL_MOVIES));
let roomsDb = JSON.parse(JSON.stringify(INITIAL_ROOMS));
let showtimesDb = JSON.parse(JSON.stringify(INITIAL_SHOWTIMES));
let foodsDb = JSON.parse(JSON.stringify(INITIAL_FOODS));
let promotionsDb = JSON.parse(JSON.stringify(INITIAL_PROMOTIONS));
let newsDb = JSON.parse(JSON.stringify(INITIAL_NEWS));
let usersDb = JSON.parse(JSON.stringify(INITIAL_USERS));

// Giả lập độ trễ mạng async (200ms)
const mockDelay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper phân trang danh sách
const paginateList = (list, page = 0, size = 10) => {
  const pageNum = Number(page) || 0;
  const pageSize = Number(size) || 10;
  const totalElements = list.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  const startIndex = pageNum * pageSize;
  const content = list.slice(startIndex, startIndex + pageSize);

  return {
    content,
    page: pageNum,
    size: pageSize,
    totalElements,
    totalPages,
  };
};

/* =====================================================================
 * 1. QUẢN LÝ PHIM (Movies)
 * ===================================================================== */

export const adminApi = {
  /**
   * Endpoint thật: GET /api/movies?includeInactive=true&sort=newest&status=...&keyword=...&page=...&size=...
   * API.md mục 3
   */
  listMovies: async ({ keyword = '', status = '', includeInactive = true, sort = 'newest', page = 0, size = 10 } = {}) => {
    const params = {
      page,
      size,
      includeInactive,
      sort,
    };
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim();
    }
    if (status && status !== 'ALL') {
      params.status = status;
    }
    const res = await axiosClient.get('/movies', { params });
    return res.data;
  },

  /**
   * Endpoint thật: POST /api/movies
   * API.md mục 3
   */
  createMovie: async (movieData) => {
    const payload = {
      title: movieData.title?.trim(),
      description: movieData.description?.trim() || null,
      duration: Number(movieData.duration),
      genre: movieData.genre?.trim() || null,
      ageLimit: movieData.ageLimit,
      releaseDate: movieData.releaseDate ? movieData.releaseDate : null,
      movieStatus: movieData.movieStatus,
      posterUrl: movieData.posterUrl?.trim() || null,
    };
    try {
      const res = await axiosClient.post('/movies', payload);
      moviesDb.unshift(res.data);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi tạo phim mới';
      throw new Error(message);
    }
  },

  /**
   * Endpoint thật: PUT /api/movies/{id}
   * API.md mục 3
   */
  updateMovie: async (id, movieData) => {
    const payload = {
      title: movieData.title?.trim(),
      description: movieData.description?.trim() || null,
      duration: Number(movieData.duration),
      genre: movieData.genre?.trim() || null,
      ageLimit: movieData.ageLimit,
      releaseDate: movieData.releaseDate ? movieData.releaseDate : null,
      movieStatus: movieData.movieStatus,
      posterUrl: movieData.posterUrl?.trim() || null,
      isActive: movieData.isActive,
    };
    try {
      const res = await axiosClient.put(`/movies/${id}`, payload);
      const index = moviesDb.findIndex((m) => m.movieId === Number(id));
      if (index !== -1) {
        moviesDb[index] = res.data;
      }
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi cập nhật phim';
      throw new Error(message);
    }
  },

  /**
   * Endpoint thật: DELETE /api/movies/{id} (Ẩn phim isActive = false)
   * API.md mục 3, BR-MOV-03
   */
  hideMovie: async (id) => {
    try {
      await axiosClient.delete(`/movies/${id}`);
      const movie = moviesDb.find((m) => m.movieId === Number(id));
      if (movie) movie.isActive = false;
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi ẩn phim';
      throw new Error(message);
    }
  },

  /**
   * Phục hồi / Hiện lại phim đã ẩn (isActive = true)
   * Gọi PUT /api/movies/{id} kèm isActive: true
   */
  restoreMovie: async (id, movieData) => {
    try {
      let data = movieData;
      if (!data || !data.title) {
        const detail = await axiosClient.get(`/movies/${id}`);
        data = detail.data;
      }
      const payload = {
        title: data.title?.trim(),
        description: data.description?.trim() || null,
        duration: Number(data.duration),
        genre: data.genre?.trim() || null,
        ageLimit: data.ageLimit,
        releaseDate: data.releaseDate ? data.releaseDate : null,
        movieStatus: data.movieStatus,
        posterUrl: data.posterUrl?.trim() || null,
        isActive: true,
      };
      const res = await axiosClient.put(`/movies/${id}`, payload);
      const movie = moviesDb.find((m) => m.movieId === Number(id));
      if (movie) movie.isActive = true;
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi phục hồi phim';
      throw new Error(message);
    }
  },

  /* =====================================================================
   * 2. PHÒNG VÀ SUẤT CHIẾU (Rooms & Showtimes)
   * ===================================================================== */

  /**
   * Endpoint thật: GET /api/rooms
   * API.md mục 8
   */
  listRooms: async () => {
    const res = await axiosClient.get('/rooms');
    return res.data;
  },

  /**
   * Endpoint thật: GET /api/showtimes
   * API.md mục 4
   */
  listShowtimes: async ({ date = '', movieId = '', roomId = '', keyword = '' } = {}) => {
    const params = {};
    if (date) params.date = date;
    if (movieId && movieId !== 'ALL') params.movieId = movieId;
    if (roomId && roomId !== 'ALL') params.roomId = roomId;
    if (keyword && keyword.trim()) params.keyword = keyword.trim();
    const res = await axiosClient.get('/showtimes', { params });
    return res.data;
  },

  /**
   * Endpoint thật: POST /api/showtimes
   * API.md mục 4, BR-SHOW-01 đến BR-SHOW-04
   */
  createShowtime: async ({ movieId, roomId, startTime, priceMultiplier = 1.0 }) => {
    try {
      const payload = {
        movieId: Number(movieId),
        roomId: Number(roomId),
        startTime,
        priceMultiplier: Number(priceMultiplier) || 1.0,
      };
      const res = await axiosClient.post('/showtimes', payload);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi tạo suất chiếu mới';
      throw new Error(message);
    }
  },

  /**
   * Endpoint thật: PUT /api/showtimes/{id}
   * API.md mục 4, BR-SHOW-05
   */
  updateShowtime: async (id, { movieId, roomId, startTime, priceMultiplier }) => {
    try {
      const payload = {
        movieId: Number(movieId),
        roomId: Number(roomId),
        startTime,
        priceMultiplier: Number(priceMultiplier) || 1.0,
      };
      const res = await axiosClient.put(`/showtimes/${id}`, payload);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi cập nhật suất chiếu';
      throw new Error(message);
    }
  },

  /**
   * Endpoint thật: DELETE /api/showtimes/{id} (Hủy suất chiếu isActive = false)
   * API.md mục 4, BR-SHOW-06
   */
  cancelShowtime: async (id) => {
    try {
      await axiosClient.delete(`/showtimes/${id}`);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi hủy suất chiếu';
      throw new Error(message);
    }
  },

  /* =====================================================================
   * 3. QUẢN LÝ ĐỒ ĂN (Foods)
   * ===================================================================== */

  /**
   * Endpoint thật: GET /api/foods?includeUnavailable=true&category=...&keyword=...
   * API.md mục 9
   */
  listFoods: async ({ category = '', keyword = '', includeUnavailable = true } = {}) => {
    const params = {
      includeUnavailable,
    };
    if (category && category !== 'ALL') {
      params.category = category;
    }
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim();
    }
    const res = await axiosClient.get('/foods', { params });
    return res.data;
  },

  /**
   * Endpoint thật: POST /api/foods
   * API.md mục 9
   */
  createFood: async (foodData) => {
    try {
      const payload = {
        name: foodData.name?.trim(),
        price: Number(foodData.price),
        category: foodData.category || null,
        img: foodData.img?.trim() || null,
        isAvailable: foodData.isAvailable !== false,
      };
      const res = await axiosClient.post('/foods', payload);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi thêm món ăn mới';
      throw new Error(message);
    }
  },

  /**
   * Endpoint thật: PUT /api/foods/{id}
   * API.md mục 9
   */
  updateFood: async (id, foodData) => {
    try {
      const payload = {
        name: foodData.name?.trim(),
        price: Number(foodData.price),
        category: foodData.category || null,
        img: foodData.img?.trim() || null,
        isAvailable: foodData.isAvailable,
      };
      const res = await axiosClient.put(`/foods/${id}`, payload);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi cập nhật món ăn';
      throw new Error(message);
    }
  },

  /**
   * Ngừng bán (DELETE /api/foods/{id})
   * API.md mục 9
   */
  deleteFood: async (id) => {
    try {
      await axiosClient.delete(`/foods/${id}`);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi ngừng bán món ăn';
      throw new Error(message);
    }
  },

  /**
   * Chuyển trạng thái: Ngừng bán (DELETE /api/foods/{id}) hoặc Mở bán lại (PUT /api/foods/{id})
   * API.md mục 9
   */
  setFoodAvailable: async (id, isAvailable, existingFood = null) => {
    if (!isAvailable) {
      return await adminApi.deleteFood(id);
    }
    if (!existingFood) {
      throw new Error('Thiếu thông tin món ăn để mở bán lại');
    }
    return await adminApi.updateFood(id, {
      name: existingFood.name,
      price: existingFood.price,
      category: existingFood.category,
      img: existingFood.img,
      isAvailable: true,
    });
  },

  /* =====================================================================
   * 4. TIN TỨC VÀ KHUYẾN MÃI (News & Promotions)
   * ===================================================================== */

  /**
   * Endpoint thật: GET /api/news?keyword=...&page=...&size=...
   * API.md mục 11
   */
  listNews: async ({ keyword = '', page = 0, size = 10 } = {}) => {
    const params = {
      page,
      size,
    };
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim();
    }
    const res = await axiosClient.get('/news', { params });
    return res.data;
  },

  /**
   * Endpoint thật: POST /api/news
   * API.md mục 11
   */
  createNews: async (newsData) => {
    try {
      const payload = {
        title: newsData.title?.trim(),
        content: newsData.content?.trim(),
        imageUrl: newsData.imageUrl?.trim() || newsData.img?.trim() || null,
      };
      const res = await axiosClient.post('/news', payload);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi tạo bài viết mới';
      throw new Error(message);
    }
  },

  /**
   * Endpoint thật: PUT /api/news/{id}
   * API.md mục 11
   */
  updateNews: async (id, newsData) => {
    try {
      const payload = {
        title: newsData.title?.trim(),
        content: newsData.content?.trim(),
        imageUrl: newsData.imageUrl?.trim() || newsData.img?.trim() || null,
      };
      const res = await axiosClient.put(`/news/${id}`, payload);
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi cập nhật bài viết';
      throw new Error(message);
    }
  },

  /**
   * Endpoint thật: DELETE /api/news/{id} (Xóa thật)
   * API.md mục 11
   */
  deleteNews: async (id) => {
    try {
      await axiosClient.delete(`/news/${id}`);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi xóa bài viết';
      throw new Error(message);
    }
  },

  /**
   * Endpoint thật: GET /api/promotions
   * API.md mục 10
   */
  listPromotions: async ({ keyword = '', includeInactive = false } = {}) => {
    const params = { includeInactive };
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim();
    }
    const res = await axiosClient.get('/promotions', { params });
    return res.data;
  },

  /**
   * Endpoint thật: POST /api/promotions
   * API.md mục 10
   */
  createPromotion: async (promoData) => {
    const payload = {
      code: (promoData.code || '').trim().toUpperCase(),
      discountType: promoData.discountType,
      discountValue: Number(promoData.discountValue),
      minOrderValue: Number(promoData.minOrderValue) || 0,
      expiryDate: promoData.expiryDate?.includes('T')
        ? promoData.expiryDate
        : `${promoData.expiryDate}T23:59:59`,
    };
    try {
      const res = await axiosClient.post('/promotions', payload);
      return res.data;
    } catch (err) {
      const errorData = err.response?.data;
      throw {
        status: err.response?.status || 500,
        code: errorData?.code || 'ERROR',
        message: errorData?.message || 'Lỗi khi tạo mã khuyến mãi',
      };
    }
  },

  /**
   * Endpoint thật: PUT /api/promotions/{id}
   * API.md mục 10
   */
  updatePromotion: async (id, promoData) => {
    const payload = {
      code: (promoData.code || '').trim().toUpperCase(),
      discountType: promoData.discountType,
      discountValue: Number(promoData.discountValue),
      minOrderValue: Number(promoData.minOrderValue) || 0,
      expiryDate: promoData.expiryDate?.includes('T')
        ? promoData.expiryDate
        : `${promoData.expiryDate}T23:59:59`,
      isActive: promoData.isActive,
    };
    try {
      const res = await axiosClient.put(`/promotions/${id}`, payload);
      return res.data;
    } catch (err) {
      const errorData = err.response?.data;
      throw {
        status: err.response?.status || 500,
        code: errorData?.code || 'ERROR',
        message: errorData?.message || 'Lỗi khi cập nhật mã khuyến mãi',
      };
    }
  },

  /**
   * Ngừng hoặc Kích hoạt lại mã khuyến mãi
   * API.md mục 10
   */
  setPromotionActive: async (id, isActive) => {
    try {
      const res = await axiosClient.patch(`/promotions/${id}/status`, null, {
        params: { active: Boolean(isActive) },
      });
      return { success: true, isActive: res.data.isActive };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi thay đổi trạng thái mã khuyến mãi';
      throw new Error(message);
    }
  },

  /* =====================================================================
   * 5. QUẢN LÝ NGƯỜI DÙNG (Users)
   * ===================================================================== */

  /**
   * Endpoint thật: GET /api/users?role=...&keyword=...&page=...&size=...
   * API.md mục 2, BR-ROLE-04
   */
  listUsers: async ({ role = '', keyword = '', page = 0, size = 10 } = {}) => {
    const params = { page, size };
    if (role && role !== 'ALL') {
      params.role = role;
    }
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim();
    }
    const res = await axiosClient.get('/users', { params });
    return res.data;
  },

  /**
   * Endpoint thật: PATCH /api/users/{id}/role
   * API.md mục 2, BR-ROLE-04
   */
  updateUserRole: async (targetUserId, newRole) => {
    try {
      const res = await axiosClient.patch(`/users/${targetUserId}/role`, { role: newRole });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi đổi vai trò người dùng';
      throw new Error(message);
    }
  },

  /**
   * Endpoint thật: PATCH /api/users/{id}/status (Khóa / Mở khóa)
   * API.md mục 2, BR-USER-02, BR-ROLE-04
   */
  setUserActive: async (targetUserId, isActive) => {
    try {
      const res = await axiosClient.patch(`/users/${targetUserId}/status`, { isActive: Boolean(isActive) });
      return res.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Lỗi khi thay đổi trạng thái tài khoản';
      throw new Error(message);
    }
  },

  /* =====================================================================
   * 6. TẢI ẢNH LÊN CLOUDINARY (Uploads)
   * ===================================================================== */

  /**
   * Endpoint thật: POST /api/uploads/signature
   * API.md mục 12
   */
  getUploadSignature: async () => {
    const response = await axiosClient.post('/uploads/signature');
    return response.data;
  },
};

export default adminApi;

