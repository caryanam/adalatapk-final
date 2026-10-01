import apiClient from './apiClient';

export const customerApi = {
  register: (customerData: any) => {
    return apiClient.post('/api/customer/register', customerData);
  },

  initiatePayment: (paymentData: any) => {
    return apiClient.post('/api/customer/payment/initiate', paymentData);
  },

  verifyPayment: (paymentData: any) => {
    return apiClient.post('/api/customer/payment/verify', paymentData);
  },

  login: (identifier: string, password: string) => {
    return apiClient.post('/api/customer/login', { identifier, password });
  },

  getProfile: (id: string | number) => {
    return apiClient.get(`/api/customer/${id}`);
  },

  updateProfile: (profileData: any) => {
    return apiClient.put('/api/customer/profile', profileData);
  },

  changePassword: (passwordData: any) => {
    return apiClient.put('/api/customer/change-password', passwordData);
  }
};
