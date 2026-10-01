import apiClient from './apiClient';

export const adminApi = {
  // Pending & Lawyer Management
  getPendingLawyers: () => {
    return apiClient.get('/api/admin/lawyers/pending');
  },

  getAllLawyers: () => {
    return apiClient.get('/api/admin/lawyers');
  },

  getLawyerDetails: (lawyerId: string | number) => {
    return apiClient.get(`/api/admin/lawyers/${lawyerId}`);
  },

  approveLawyer: (lawyerId: string | number) => {
    return apiClient.post(`/api/admin/lawyers/${lawyerId}/approve`);
  },

  rejectLawyer: (lawyerId: string | number, rejectionReason: string) => {
    return apiClient.post(`/api/admin/lawyers/${lawyerId}/reject`, { rejectionReason });
  },

  // Customers Management
  getCustomers: () => {
    return apiClient.get('/api/admin/customers');
  },

  // Payments / Financial Audit
  getPayments: () => {
    return apiClient.get('/api/admin/payments');
  }
};
