import axiosClient from './axiosClient';

export const authApi = {
  login: (email, password) => {
    return axiosClient.post('/auth/login', { email, password });
  },
  me: () => {
    return axiosClient.get('/auth/me');
  },
  register: (data) => {
    return axiosClient.post('/auth/register', data);
  },
  verifyEmail: (data) => {
    return axiosClient.post('/auth/verify-email', data);
  },
  resendOtp: (data) => {
    return axiosClient.post('/auth/resend-otp', data);
  },
  forgotPassword: (data) => {
    return axiosClient.post('/auth/forgot-password', data);
  },
  resetPassword: (data) => {
    return axiosClient.post('/auth/reset-password', data);
  },
};

export default authApi;
