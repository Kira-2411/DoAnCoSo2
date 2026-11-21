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
   * Endpoint thật: GET /api/foods?includeUnavailable=true&category=...
   * API.md mục 9
   */
  listFoods: async ({ category = '', keyword = '', includeUnavailable = false } = {}) => {
    await mockDelay();
    let result = [...foodsDb];

    if (!includeUnavailable) {
      result = result.filter((f) => f.isAvailable);
    }

    if (category && category !== 'ALL') {
      result = result.filter((f) => f.category === category);
    }

    const kw = keyword.trim().toLowerCase();
    if (kw) {
      result = result.filter((f) => f.name.toLowerCase().includes(kw));
    }

    return result;
  },

  /**
   * Endpoint thật: POST /api/foods
   * API.md mục 9
   */
  createFood: async (foodData) => {
    await mockDelay();
    const newId = foodsDb.length > 0 ? Math.max(...foodsDb.map((f) => f.foodId)) + 1 : 1;
    const newFood = {
      ...foodData,
      foodId: newId,
      price: Number(foodData.price) || 0,
      isAvailable: foodData.isAvailable !== false,
    };
    foodsDb.unshift(newFood);
    return newFood;
  },

  /**
   * Endpoint thật: PUT /api/foods/{id}
   * API.md mục 9
   */
  updateFood: async (id, foodData) => {
    await mockDelay();
    const index = foodsDb.findIndex((f) => f.foodId === Number(id));
    if (index === -1) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy món ăn' };
    }
    const updated = {
      ...foodsDb[index],
      ...foodData,
      foodId: Number(id),
      price: Number(foodData.price) || 0,
    };
    foodsDb[index] = updated;
    return updated;
  },

  /**
   * Ngừng bán (DELETE /api/foods/{id}) hoặc Bán lại
   * API.md mục 9, BR-FOOD-01
   */
  setFoodAvailable: async (id, isAvailable) => {
    await mockDelay();
    const food = foodsDb.find((f) => f.foodId === Number(id));
    if (!food) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy món ăn' };
    }
    food.isAvailable = Boolean(isAvailable);
    return { success: true, isAvailable: food.isAvailable };
  },

  /* =====================================================================
   * 4. TIN TỨC VÀ KHUYẾN MÃI (News & Promotions)
   * ===================================================================== */

  /**
   * Endpoint thật: GET /api/news
   * API.md mục 11
   */
  listNews: async ({ keyword = '', page = 0, size = 10 } = {}) => {
    await mockDelay();
    let result = [...newsDb];

    const kw = keyword.trim().toLowerCase();
    if (kw) {
      result = result.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(kw)) ||
          (n.content && n.content.toLowerCase().includes(kw))
      );
    }

    result.sort((a, b) => b.newsId - a.newsId);
    return paginateList(result, page, size);
  },

  /**
   * Endpoint thật: POST /api/news
   * API.md mục 11
   */
  createNews: async (newsData) => {
    await mockDelay();
    const newId = newsDb.length > 0 ? Math.max(...newsDb.map((n) => n.newsId)) + 1 : 1;
    const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, '');
    const item = {
      ...newsData,
      newsId: newId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    newsDb.unshift(item);
    return item;
  },

  /**
   * Endpoint thật: PUT /api/news/{id}
   * API.md mục 11
   */
  updateNews: async (id, newsData) => {
    await mockDelay();
    const index = newsDb.findIndex((n) => n.newsId === Number(id));
    if (index === -1) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' };
    }
    const nowIso = new Date().toISOString().replace(/\.\d{3}Z$/, '');
    const updated = {
      ...newsDb[index],
      ...newsData,
      newsId: Number(id),
      updatedAt: nowIso,
    };
    newsDb[index] = updated;
    return updated;
  },

  /**
   * Endpoint thật: DELETE /api/news/{id} (Xóa thật)
   * API.md mục 11, BR-NEWS-01
   */
  deleteNews: async (id) => {
    await mockDelay();
    const index = newsDb.findIndex((n) => n.newsId === Number(id));
    if (index === -1) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy bài viết' };
    }
    newsDb.splice(index, 1);
    return { success: true };
  },

  /**
   * Endpoint thật: GET /api/promotions
   * API.md mục 10
   */
  listPromotions: async ({ keyword = '', includeInactive = false } = {}) => {
    await mockDelay();
    let result = [...promotionsDb];

    if (!includeInactive) {
      result = result.filter((p) => p.isActive);
    }

    const kw = keyword.trim().toUpperCase();
    if (kw) {
      result = result.filter((p) => p.code.includes(kw));
    }

    result.sort((a, b) => b.promoId - a.promoId);
    return result;
  },

  /**
   * Endpoint thật: POST /api/promotions
   * API.md mục 10, BR-PROMO-01 đến 05
   */
  createPromotion: async (promoData) => {
    await mockDelay();
    const cleanCode = (promoData.code || '').trim().toUpperCase();

    // Kiểm tra trùng code
    if (promotionsDb.some((p) => p.code === cleanCode)) {
      throw {
        status: 409,
        code: 'PROMO_EXISTS',
        message: `Mã khuyến mãi "${cleanCode}" đã tồn tại trên hệ thống`,
      };
    }

    const newId = promotionsDb.length > 0 ? Math.max(...promotionsDb.map((p) => p.promoId)) + 1 : 1;
    const newPromo = {
      ...promoData,
      promoId: newId,
      code: cleanCode,
      discountValue: Number(promoData.discountValue),
      minOrderValue: Number(promoData.minOrderValue) || 0,
      isActive: true,
    };
    promotionsDb.unshift(newPromo);
    return newPromo;
  },

  /**
   * Endpoint thật: PUT /api/promotions/{id}
   * API.md mục 10
   */
  updatePromotion: async (id, promoData) => {
    await mockDelay();
    const index = promotionsDb.findIndex((p) => p.promoId === Number(id));
    if (index === -1) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy mã khuyến mãi' };
    }

    const cleanCode = (promoData.code || '').trim().toUpperCase();
    if (promotionsDb.some((p) => p.promoId !== Number(id) && p.code === cleanCode)) {
      throw {
        status: 409,
        code: 'PROMO_EXISTS',
        message: `Mã khuyến mãi "${cleanCode}" đã trùng với mã khác`,
      };
    }

    const updated = {
      ...promotionsDb[index],
      ...promoData,
      code: cleanCode,
      discountValue: Number(promoData.discountValue),
      minOrderValue: Number(promoData.minOrderValue) || 0,
    };
    promotionsDb[index] = updated;
    return updated;
  },

  /**
   * Ngừng hoặc Kích hoạt lại mã khuyến mãi
   * API.md mục 10, BR-PROMO-05
   */
  setPromotionActive: async (id, isActive) => {
    await mockDelay();
    const promo = promotionsDb.find((p) => p.promoId === Number(id));
    if (!promo) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy mã khuyến mãi' };
    }
    promo.isActive = Boolean(isActive);
    return { success: true, isActive: promo.isActive };
  },

  /* =====================================================================
   * 5. QUẢN LÝ NGƯỜI DÙNG (Users)
   * ===================================================================== */

  /**
   * Endpoint thật: GET /api/users?role=...&keyword=...&page=...&size=...
   * API.md mục 2, BR-ROLE-04
   */
  listUsers: async ({ role = '', keyword = '', page = 0, size = 10 } = {}) => {
    await mockDelay();
    let result = [...usersDb];

    // Lọc theo vai trò
    if (role && role !== 'ALL') {
      result = result.filter((u) => u.role === role);
    }

    // Tìm kiếm theo username hoặc email
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      result = result.filter(
        (u) =>
          u.username.toLowerCase().includes(kw) ||
          u.email.toLowerCase().includes(kw) ||
          (u.phone && u.phone.includes(kw))
      );
    }

    // Sắp xếp theo thứ tự vai trò: ADMIN (1) -> STAFF (2) -> CUSTOMER (3), sau đó theo username A-Z
    const rolePriority = { ADMIN: 1, STAFF: 2, CUSTOMER: 3 };
    result.sort((a, b) => {
      const pDiff = (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
      if (pDiff !== 0) return pDiff;
      return a.username.localeCompare(b.username, 'vi');
    });

    return paginateList(result, page, size);
  },

  /**
   * Endpoint thật: PATCH /api/users/{id}/role
   * API.md mục 2, BR-ROLE-04
   */
  updateUserRole: async (targetUserId, newRole, currentUserId) => {
    await mockDelay();
    const target = usersDb.find((u) => u.userId === Number(targetUserId));
    if (!target) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy người dùng' };
    }

    // BR-ROLE-04: Admin không được tự hạ quyền của chính mình
    if (Number(targetUserId) === Number(currentUserId) && newRole !== 'ADMIN') {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'Bạn không thể tự hạ vai trò quản trị của chính mình (BR-ROLE-04)',
      };
    }

    // BR-ROLE-04: Không được hạ quyền Admin cuối cùng đang hoạt động
    if (target.role === 'ADMIN' && newRole !== 'ADMIN') {
      const activeAdmins = usersDb.filter((u) => u.role === 'ADMIN' && u.isActive);
      if (activeAdmins.length <= 1) {
        throw {
          status: 403,
          code: 'FORBIDDEN',
          message: 'Không thể hạ quyền Admin cuối cùng của hệ thống (BR-ROLE-04)',
        };
      }
    }

    target.role = newRole;
    return { success: true, role: target.role };
  },

  /**
   * Endpoint thật: PATCH /api/users/{id}/status (Khóa / Mở khóa)
   * API.md mục 2, BR-USER-02, BR-ROLE-04
   */
  setUserActive: async (targetUserId, isActive, currentUserId) => {
    await mockDelay();
    const target = usersDb.find((u) => u.userId === Number(targetUserId));
    if (!target) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy người dùng' };
    }

    // BR-ROLE-04: Admin không được tự khóa chính mình
    if (Number(targetUserId) === Number(currentUserId) && !isActive) {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'Bạn không thể tự khóa tài khoản của chính mình (BR-ROLE-04)',
      };
    }

    // BR-ROLE-04: Không được khóa Admin cuối cùng đang hoạt động
    if (target.role === 'ADMIN' && !isActive) {
      const activeAdmins = usersDb.filter((u) => u.role === 'ADMIN' && u.isActive);
      if (activeAdmins.length <= 1) {
        throw {
          status: 403,
          code: 'FORBIDDEN',
          message: 'Không thể khóa tài khoản Admin cuối cùng của hệ thống (BR-ROLE-04)',
        };
      }
    }

    target.isActive = Boolean(isActive);
    return { success: true, isActive: target.isActive };
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

