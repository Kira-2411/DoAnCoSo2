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
};

export default authApi;
