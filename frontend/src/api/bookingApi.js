import axiosClient from './axiosClient';

export const bookingApi = {
  // Lấy lịch sử đặt vé của người dùng đang đăng nhập
  getMyBookings: (params = {}) => {
    return axiosClient.get('/users/me/bookings', { params });
  },
};

export default bookingApi;

