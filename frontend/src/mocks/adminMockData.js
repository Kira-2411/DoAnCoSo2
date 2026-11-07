/**
 * DỮ LIỆU GIẢ CHO TRANG QUẢN TRỊ (ADMIN)
 * Dữ liệu chỉ nằm trong bộ nhớ (RAM), không lưu vào localStorage.
 * Tải lại trang sẽ reset về trạng thái ban đầu.
 * Tham chiếu gốc: backend/src/main/resources/db/migration/V2__seed_dev_data.sql
 */

// Hàm tiện ích tạo chuỗi ISO thời gian không múi giờ (YYYY-MM-DDTHH:mm:ss)
const getIsoDateTime = (offsetDays, timeStr) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T${timeStr}`;
};

// Hàm tính endTime = startTime + duration (phút) + 15 phút dọn phòng (BR-SHOW-01)
export const calculateEndTime = (startIsoStr, durationMinutes) => {
  if (!startIsoStr || !durationMinutes) return '';
  const startDate = new Date(startIsoStr);
  if (isNaN(startDate.getTime())) return '';
  const totalMinutes = Number(durationMinutes) + 15; // 15 phút dọn dẹp
  const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);
  
  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, '0');
  const day = String(endDate.getDate()).padStart(2, '0');
  const hours = String(endDate.getHours()).padStart(2, '0');
  const minutes = String(endDate.getMinutes()).padStart(2, '0');
  const seconds = String(endDate.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

export const INITIAL_ROOMS = [
  { roomId: 1, roomName: 'Phòng 1', theaterId: 1, isActive: true, totalSeats: 96 },
  { roomId: 2, roomName: 'Phòng 2', theaterId: 1, isActive: true, totalSeats: 96 },
];

export const INITIAL_MOVIES = [
  {
    movieId: 1,
    title: 'Hành Trình Về Phía Biển',
    description: 'Hai anh em đi dọc miền Trung để tìm lại ngôi nhà tuổi thơ.',
    duration: 120,
    genre: 'Tâm lý, Gia đình',
    ageLimit: 'P',
    releaseDate: '2026-10-25',
    movieStatus: 'NOW_SHOWING',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    movieId: 2,
    title: 'Thám Tử Phố Cổ',
    description: 'Một vụ mất tích bí ẩn giữa những con phố cổ về đêm.',
    duration: 105,
    genre: 'Hình sự, Bí ẩn',
    ageLimit: 'T16',
    releaseDate: '2026-10-28',
    movieStatus: 'NOW_SHOWING',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    movieId: 3,
    title: 'Đêm Cuối Ở Hội An',
    description: 'Chuyến du lịch cuối năm của nhóm bạn thân thay đổi mọi thứ.',
    duration: 130,
    genre: 'Lãng mạn, Hài',
    ageLimit: 'T13',
    releaseDate: '2026-11-01',
    movieStatus: 'NOW_SHOWING',
    posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    movieId: 4,
    title: 'Tiếng Gọi Từ Rừng Sâu',
    description: 'Đoàn thám hiểm lạc vào cánh rừng không có trên bản đồ.',
    duration: 115,
    genre: 'Phiêu lưu',
    ageLimit: 'T13',
    releaseDate: '2026-11-20',
    movieStatus: 'COMING_SOON',
    posterUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    movieId: 5,
    title: 'Mùa Hè Cuối Cùng',
    description: 'Câu chuyện tình bạn trong mùa hè trước khi rời ghế nhà trường.',
    duration: 98,
    genre: 'Học đường',
    ageLimit: 'P',
    releaseDate: '2026-08-01',
    movieStatus: 'ENDED',
    posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    movieId: 6,
    title: 'Kẻ Trộm Mặt Trăng (Bản cũ)',
    description: 'Một bộ phim hoạt hình kinh điển đã ngừng chiếu và được ẩn.',
    duration: 95,
    genre: 'Hoạt hình',
    ageLimit: 'P',
    releaseDate: '2026-06-15',
    movieStatus: 'ENDED',
    posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&auto=format&fit=crop&q=80',
    isActive: false, // Phim đã ẩn để thử nghiệm chức năng "Hiện lại"
  },
];

export const INITIAL_SHOWTIMES = [
  {
    showId: 1,
    movieId: 1,
    roomId: 1,
    startTime: getIsoDateTime(1, '18:00:00'),
    endTime: calculateEndTime(getIsoDateTime(1, '18:00:00'), 120),
    priceMultiplier: 1.0,
    isActive: true,
    hasPaidBookings: false,
  },
  {
    showId: 2,
    movieId: 2,
    roomId: 1,
    startTime: getIsoDateTime(1, '20:30:00'),
    endTime: calculateEndTime(getIsoDateTime(1, '20:30:00'), 105),
    priceMultiplier: 1.0,
    isActive: true,
    hasPaidBookings: true, // Mô phỏng suất chiếu ĐÃ CÓ ĐƠN THANH TOÁN để kiểm tra lỗi 409
  },
  {
    showId: 3,
    movieId: 3,
    roomId: 2,
    startTime: getIsoDateTime(1, '19:00:00'),
    endTime: calculateEndTime(getIsoDateTime(1, '19:00:00'), 130),
    priceMultiplier: 1.0,
    isActive: true,
    hasPaidBookings: false,
  },
  {
    showId: 4,
    movieId: 3,
    roomId: 2,
    startTime: getIsoDateTime(1, '21:45:00'),
    endTime: calculateEndTime(getIsoDateTime(1, '21:45:00'), 130),
    priceMultiplier: 1.0,
    isActive: true,
    hasPaidBookings: false,
  },
  {
    showId: 5,
    movieId: 1,
    roomId: 1,
    startTime: getIsoDateTime(2, '14:00:00'),
    endTime: calculateEndTime(getIsoDateTime(2, '14:00:00'), 120),
    priceMultiplier: 1.2,
    isActive: true,
    hasPaidBookings: false,
  },
  {
    showId: 6,
    movieId: 3,
    roomId: 1,
    startTime: getIsoDateTime(2, '17:00:00'),
    endTime: calculateEndTime(getIsoDateTime(2, '17:00:00'), 130),
    priceMultiplier: 1.2,
    isActive: true,
    hasPaidBookings: false,
  },
  {
    showId: 7,
    movieId: 2,
    roomId: 2,
    startTime: getIsoDateTime(2, '19:30:00'),
    endTime: calculateEndTime(getIsoDateTime(2, '19:30:00'), 105),
    priceMultiplier: 1.2,
    isActive: true,
    hasPaidBookings: false,
  },
  {
    showId: 8,
    movieId: 2,
    roomId: 1,
    startTime: getIsoDateTime(3, '19:00:00'),
    endTime: calculateEndTime(getIsoDateTime(3, '19:00:00'), 105),
    priceMultiplier: 1.0,
    isActive: true,
    hasPaidBookings: false,
  },
  {
    showId: 9,
    movieId: 1,
    roomId: 2,
    startTime: getIsoDateTime(3, '20:00:00'),
    endTime: calculateEndTime(getIsoDateTime(3, '20:00:00'), 120),
    priceMultiplier: 1.0,
    isActive: true,
    hasPaidBookings: false,
  },
  {
    showId: 10,
    movieId: 1,
    roomId: 1,
    startTime: getIsoDateTime(-1, '19:00:00'), // Suất đã qua (hôm qua)
    endTime: calculateEndTime(getIsoDateTime(-1, '19:00:00'), 120),
    priceMultiplier: 1.0,
    isActive: true,
    hasPaidBookings: true,
  },
  {
    showId: 11,
    movieId: 2,
    roomId: 2,
    startTime: getIsoDateTime(1, '10:00:00'), // Suất đã hủy
    endTime: calculateEndTime(getIsoDateTime(1, '10:00:00'), 105),
    priceMultiplier: 1.0,
    isActive: false, // Hủy suất
    hasPaidBookings: false,
  },
];

export const INITIAL_FOODS = [
  {
    foodId: 1,
    name: 'Bắp ngọt (vừa)',
    price: 45000,
    category: 'Bắp',
    img: '/src/assets/images/AkashiBap.png',
    isAvailable: true,
  },
  {
    foodId: 2,
    name: 'Bắp phô mai (vừa)',
    price: 55000,
    category: 'Bắp',
    img: '/src/assets/images/AkashiBap2.png',
    isAvailable: true,
  },
  {
    foodId: 3,
    name: 'Nước ngọt ly lớn',
    price: 30000,
    category: 'Nước',
    img: '/src/assets/images/AkashiCo.png',
    isAvailable: true,
  },
  {
    foodId: 4,
    name: 'Combo 1 bắp 1 nước',
    price: 65000,
    category: 'Combo',
    img: '/src/assets/images/AkashiVui.png',
    isAvailable: true,
  },
  {
    foodId: 5,
    name: 'Combo 2 bắp 2 nước',
    price: 120000,
    category: 'Combo',
    img: '/src/assets/images/Akashi.png',
    isAvailable: true,
  },
  {
    foodId: 6,
    name: 'Bắp Caramel (Hết mùa)',
    price: 60000,
    category: 'Bắp',
    img: '/src/assets/images/AkashiBap.png',
    isAvailable: false, // Món ngừng bán để thử nghiệm "Bán lại"
  },
];

export const INITIAL_PROMOTIONS = [
  {
    promoId: 1,
    code: 'GIAM10',
    discountType: 'PERCENT',
    discountValue: 10,
    expiryDate: '2026-12-31T23:59:59',
    minOrderValue: 100000,
    isActive: true,
  },
  {
    promoId: 2,
    code: 'GIAM20K',
    discountType: 'FIXED',
    discountValue: 20000,
    expiryDate: '2026-12-31T23:59:59',
    minOrderValue: 150000,
    isActive: true,
  },
  {
    promoId: 3,
    code: 'KHAITRUONG',
    discountType: 'PERCENT',
    discountValue: 25,
    expiryDate: '2026-10-30T23:59:59',
    minOrderValue: 200000,
    isActive: false, // Mã đã ngừng hoạt động để thử nghiệm "Kích hoạt lại"
  },
];

export const INITIAL_NEWS = [
  {
    newsId: 1,
    title: 'Khai trương Akashi Cinema',
    content: 'Akashi Cinema chính thức mở cửa với hai phòng chiếu hiện đại và trang thiết bị âm thanh chuẩn quốc tế.',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-10-18T10:00:00',
    updatedAt: '2026-10-18T10:00:00',
  },
  {
    newsId: 2,
    title: 'Ưu đãi cuối tuần cho thành viên',
    content: 'Nhập mã GIAM10 để được giảm 10% cho đơn từ 100.000đ khi đặt vé trực tuyến vào các ngày cuối tuần.',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    createdAt: '2026-10-19T14:30:00',
    updatedAt: '2026-10-19T14:30:00',
  },
];

export const INITIAL_USERS = [
  {
    userId: 1,
    username: 'admin',
    email: 'admin@example.com',
    phone: '0901234567',
    role: 'ADMIN',
    isActive: true,
    emailVerified: true,
    createdAt: '2026-10-01T08:00:00',
  },
  {
    userId: 2,
    username: 'admin_phu',
    email: 'admin2@example.com',
    phone: '0907654321',
    role: 'ADMIN',
    isActive: true,
    emailVerified: true,
    createdAt: '2026-10-02T09:30:00',
  },
  {
    userId: 3,
    username: 'staff_banve',
    email: 'staff@example.com',
    phone: '0912345678',
    role: 'STAFF',
    isActive: true,
    emailVerified: true,
    createdAt: '2026-10-05T10:15:00',
  },
  {
    userId: 4,
    username: 'staff_soatve',
    email: 'staff2@example.com',
    phone: '0918765432',
    role: 'STAFF',
    isActive: true,
    emailVerified: true,
    createdAt: '2026-10-06T11:00:00',
  },
  {
    userId: 5,
    username: 'customer_vip',
    email: 'customer@example.com',
    phone: '0987654321',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: true,
    createdAt: '2026-10-10T14:20:00',
  },
  {
    userId: 6,
    username: 'customer_moi',
    email: 'customer2@example.com',
    phone: '0981122334',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: true,
    createdAt: '2026-10-12T16:45:00',
  },
  {
    userId: 7,
    username: 'customer_khoa',
    email: 'locked@example.com',
    phone: '0933445566',
    role: 'CUSTOMER',
    isActive: false, // Tài khoản đã bị khóa
    emailVerified: true,
    createdAt: '2026-10-15T18:10:00',
  },
  {
    userId: 8,
    username: 'customer_chuaxacthuc',
    email: 'unverified@example.com',
    phone: '0944556677',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: false, // Chưa xác thực email
    createdAt: '2026-10-20T20:00:00',
  },
];

