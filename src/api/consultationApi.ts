import apiClient from './apiClient';

export const consultationApi = {
  createConsultation: (data: any) => {
    return apiClient.post('/api/customer/consultations', data);
  },

  getMyConsultations: (status?: string) => {
    return apiClient.get('/api/customer/consultations', { params: { status } });
  },

  getRequestsForCustomer: () => {
    return apiClient.get('/api/customer/consultations');
  },

  getLawyerRequests: () => {
    return apiClient.get('/api/lawyer/consultations');
  },

  acceptLawyerRequest: (requestId: string | number, assignedDate?: string, assignedTime?: string) => {
    return apiClient.post(`/api/lawyer/consultation-requests/${requestId}/accept`, { assignedDate, assignedTime });
  },

  rejectLawyerRequest: (requestId: string | number, reason?: string) => {
    return apiClient.post(`/api/lawyer/consultation-requests/${requestId}/reject`, { reason });
  },

  getConsultationDetail: (requestId: string | number) => {
    return apiClient.get(`/api/customer/consultations/${requestId}`);
  },

  initiatePayment: (requestId: string | number) => {
    return apiClient.post(`/api/customer/consultations/${requestId}/payment/initiate`);
  },

  verifyPayment: (requestId: string | number, verifyData: any) => {
    return apiClient.post(`/api/customer/consultations/${requestId}/payment/verify`, verifyData);
  },

  unlockPaidConsultation: (consultationId: string | number, paymentId?: string, amount?: string) => {
    return apiClient.post(`/api/customer/consultations/${consultationId}/unlock`, { paymentId, amount });
  },

  completeConsultationCustomer: (requestId: string | number) => {
    return apiClient.post(`/api/customer/consultations/${requestId}/complete`);
  },

  completeConsultationLawyer: (requestId: string | number) => {
    return apiClient.post(`/api/lawyer/consultations/${requestId}/complete`);
  },

  confirmAppointment: (requestId: string | number, action: string) => {
    return apiClient.post(`/api/customer/consultations/${requestId}/confirm?action=${action}`);
  },

  getConsultationMessagesCustomer: (requestId: string | number) => {
    return apiClient.get(`/api/customer/consultations/${requestId}/messages`);
  },

  sendConsultationMessageCustomer: (requestId: string | number, message: string, attachment: any = null) => {
    const payload = {
      text: message,
      message: message,
      attachmentUrl: attachment?.url || null,
      attachmentName: attachment?.name || null,
      attachmentType: attachment?.type || null,
      attachmentSize: attachment?.size || null
    };
    return apiClient.post(`/api/customer/consultations/${requestId}/messages`, payload);
  },

  uploadConsultationAttachmentCustomer: (requestId: string | number, formData: FormData) => {
    return apiClient.post(`/api/customer/consultations/${requestId}/upload-attachment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};
