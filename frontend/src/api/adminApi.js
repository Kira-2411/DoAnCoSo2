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
   * Endpoint thật: GET /api/movies?includeInactive=true&status=...&keyword=...&page=...&size=...
   * API.md mục 3
   */
  listMovies: async ({ keyword = '', status = '', includeInactive = false, page = 0, size = 10 } = {}) => {
    await mockDelay();
    let result = [...moviesDb];

    // Lọc theo trạng thái ẩn/hiển thị
    if (!includeInactive) {
      result = result.filter((m) => m.isActive);
    }

    // Lọc theo trạng thái phim (NOW_SHOWING, COMING_SOON, ENDED)
    if (status && status !== 'ALL') {
      result = result.filter((m) => m.movieStatus === status);
    }

    // Lọc theo từ khóa (tên hoặc thể loại, không phân biệt hoa thường, bỏ khoảng trắng)
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      result = result.filter(
        (m) =>
          (m.title && m.title.toLowerCase().includes(kw)) ||
          (m.genre && m.genre.toLowerCase().includes(kw))
      );
    }

    // Sắp xếp ID giảm dần (mới nhất lên đầu)
    result.sort((a, b) => b.movieId - a.movieId);

    return paginateList(result, page, size);
  },

  /**
   * Endpoint thật: POST /api/movies
   * API.md mục 3
   */
  createMovie: async (movieData) => {
    await mockDelay();
    const newId = moviesDb.length > 0 ? Math.max(...moviesDb.map((m) => m.movieId)) + 1 : 1;
    const newMovie = {
      ...movieData,
      movieId: newId,
      duration: Number(movieData.duration),
      isActive: true,
    };
    moviesDb.unshift(newMovie);
    return newMovie;
  },

  /**
   * Endpoint thật: PUT /api/movies/{id}
   * API.md mục 3
   */
  updateMovie: async (id, movieData) => {
    await mockDelay();
    const index = moviesDb.findIndex((m) => m.movieId === Number(id));
    if (index === -1) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy phim' };
    }
    const updated = {
      ...moviesDb[index],
      ...movieData,
      movieId: Number(id),
      duration: Number(movieData.duration),
    };
    moviesDb[index] = updated;
    return updated;
  },

  /**
   * Endpoint thật: DELETE /api/movies/{id} (Ẩn phim isActive = false)
   * API.md mục 3, BR-MOV-03
   */
  hideMovie: async (id) => {
    await mockDelay();
    const movie = moviesDb.find((m) => m.movieId === Number(id));
    if (!movie) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy phim' };
    }
    movie.isActive = false;
    return { success: true };
  },

  /**
   * Phục hồi / Hiện lại phim đã ẩn (isActive = true)
   */
  restoreMovie: async (id) => {
    await mockDelay();
    const movie = moviesDb.find((m) => m.movieId === Number(id));
    if (!movie) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy phim' };
    }
    movie.isActive = true;
    return { success: true };
  },

  /* =====================================================================
   * 2. PHÒNG VÀ SUẤT CHIẾU (Rooms & Showtimes)
   * ===================================================================== */

  /**
   * Endpoint thật: GET /api/rooms
   * API.md mục 8
   */
  listRooms: async () => {
    await mockDelay(100);
    return [...roomsDb];
  },

  /**
   * Endpoint thật: GET /api/showtimes
   * API.md mục 4
   */
  listShowtimes: async ({ date = '', movieId = '', roomId = '', keyword = '' } = {}) => {
    await mockDelay();
    let result = [...showtimesDb];

    // Lọc theo ngày (YYYY-MM-DD)
    if (date) {
      result = result.filter((s) => s.startTime.startsWith(date));
    }

    // Lọc theo phim
    if (movieId && movieId !== 'ALL') {
      result = result.filter((s) => s.movieId === Number(movieId));
    }

    // Lọc theo phòng
    if (roomId && roomId !== 'ALL') {
      result = result.filter((s) => s.roomId === Number(roomId));
    }

    // Tìm kiếm theo tên phim hoặc tên phòng
    const kw = keyword.trim().toLowerCase();
    if (kw) {
      result = result.filter((s) => {
        const movie = moviesDb.find((m) => m.movieId === s.movieId);
        const room = roomsDb.find((r) => r.roomId === s.roomId);
        const movieMatch = movie?.title?.toLowerCase().includes(kw);
        const roomMatch = room?.roomName?.toLowerCase().includes(kw);
        return movieMatch || roomMatch;
      });
    }

    // Gắn thêm thông tin tên phim, tên phòng để giao diện hiển thị
    const enriched = result.map((s) => {
      const movie = moviesDb.find((m) => m.movieId === s.movieId);
      const room = roomsDb.find((r) => r.roomId === s.roomId);
      return {
        ...s,
        movieTitle: movie?.title || 'Phim đã bị xóa',
        roomName: room?.roomName || 'Phòng không xác định',
      };
    });

    // Sắp xếp: suất chiếu tương lai trước, theo thời gian tăng dần
    enriched.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return enriched;
  },

  /**
   * Endpoint thật: POST /api/showtimes
   * API.md mục 4, BR-SHOW-01 đến BR-SHOW-04
   */
  createShowtime: async ({ movieId, roomId, startTime, priceMultiplier = 1.0 }) => {
    await mockDelay();
    const movie = moviesDb.find((m) => m.movieId === Number(movieId));
    if (!movie || !movie.isActive || movie.movieStatus === 'ENDED') {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Phim không hợp lệ hoặc đã kết thúc chiếu (BR-SHOW-03)',
      };
    }

    const room = roomsDb.find((r) => r.roomId === Number(roomId));
    if (!room || !room.isActive) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Phòng chiếu không hoạt động (BR-SHOW-03)',
      };
    }

    // Kiểm tra không tạo suất ở quá khứ
    const startDate = new Date(startTime);
    if (startDate.getTime() < Date.now()) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'Không được tạo suất chiếu trong quá khứ (BR-SHOW-03)',
      };
    }

    // Tính endTime tự động
    const endTime = calculateEndTime(startTime, movie.duration);

    // Kiểm tra chồng giờ trong cùng phòng chiếu (BR-SHOW-02)
    // new.start < old.end VÀ new.end > old.start
    const newStart = new Date(startTime).getTime();
    const newEnd = new Date(endTime).getTime();

    const isOverlap = showtimesDb.some((s) => {
      if (!s.isActive || s.roomId !== Number(roomId)) return false;
      const oldStart = new Date(s.startTime).getTime();
      const oldEnd = new Date(s.endTime).getTime();
      return newStart < oldEnd && newEnd > oldStart;
    });

    if (isOverlap) {
      throw {
        status: 409,
        code: 'SHOWTIME_OVERLAP',
        message: 'Phòng chiếu đã có suất chiếu khác trùng thời gian này (BR-SHOW-02)',
      };
    }

    const newId = showtimesDb.length > 0 ? Math.max(...showtimesDb.map((s) => s.showId)) + 1 : 1;
    const newShowtime = {
      showId: newId,
      movieId: Number(movieId),
      roomId: Number(roomId),
      startTime,
      endTime,
      priceMultiplier: Number(priceMultiplier) || 1.0,
      isActive: true,
      hasPaidBookings: false,
    };

    showtimesDb.push(newShowtime);
    return newShowtime;
  },

  /**
   * Endpoint thật: PUT /api/showtimes/{id}
   * API.md mục 4, BR-SHOW-05
   */
  updateShowtime: async (id, { movieId, roomId, startTime, priceMultiplier }) => {
    await mockDelay();
    const index = showtimesDb.findIndex((s) => s.showId === Number(id));
    if (index === -1) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy suất chiếu' };
    }
    const current = showtimesDb[index];

    if (current.hasPaidBookings) {
      throw {
        status: 409,
        code: 'HAS_PAID_BOOKINGS',
        message: 'Suất chiếu đã có đơn thanh toán, không thể thay đổi thông tin (BR-SHOW-05)',
      };
    }

    const movie = moviesDb.find((m) => m.movieId === Number(movieId));
    const endTime = calculateEndTime(startTime, movie ? movie.duration : 120);

    const updated = {
      ...current,
      movieId: Number(movieId),
      roomId: Number(roomId),
      startTime,
      endTime,
      priceMultiplier: Number(priceMultiplier) || 1.0,
    };

    showtimesDb[index] = updated;
    return updated;
  },

  /**
   * Endpoint thật: DELETE /api/showtimes/{id} (Hủy suất chiếu isActive = false)
   * API.md mục 4, BR-SHOW-06
   */
  cancelShowtime: async (id) => {
    await mockDelay();
    const showtime = showtimesDb.find((s) => s.showId === Number(id));
    if (!showtime) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Không tìm thấy suất chiếu' };
    }

    // Mô phỏng kiểm tra đơn thanh toán
    if (showtime.hasPaidBookings) {
      throw {
        status: 409,
        code: 'HAS_PAID_BOOKINGS',
        message: 'Suất chiếu đã có đơn thanh toán, cần hủy các đơn đó trước (BR-SHOW-06)',
      };
    }

    showtime.isActive = false;
    return { success: true };
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
};

export default adminApi;

