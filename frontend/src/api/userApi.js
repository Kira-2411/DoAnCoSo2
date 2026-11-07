import axiosClient from './axiosClient';

export const userApi = {
  // Lấy thông tin cá nhân của người dùng đang đăng nhập
  getProfile: () => {
    return axiosClient.get('/users/me');
  },

  // Cập nhật thông tin cá nhân (họ tên, số điện thoại)
  updateProfile: (data) => {
    return axiosClient.put('/users/me', data);
  },

  // Lấy lịch sử đặt vé cá nhân (phân trang, lọc theo status)
  getMyBookings: (params = {}) => {
    return axiosClient.get('/users/me/bookings', { params });
  },
};

export default userApi;

