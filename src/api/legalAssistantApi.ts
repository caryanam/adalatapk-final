import apiClient from './apiClient';

export const legalAssistantApi = {
  getSessions: () => {
    return apiClient.get('/api/customer/legal-assistance/sessions');
  },
  getSessionDetail: (sessionId: string | number) => {
    return apiClient.get(`/api/customer/legal-assistance/sessions/${sessionId}`);
  },
  createSession: (forceNew: boolean = false) => {
    return apiClient.post(`/api/customer/legal-assistance/sessions?forceNew=${forceNew}`);
  },
  deleteSession: (sessionId: string | number) => {
    return apiClient.delete(`/api/customer/legal-assistance/sessions/${sessionId}`);
  },
  sendMessage: (sessionId: string | number, message: string, clientMessageId: string) => {
    return apiClient.post(`/api/customer/legal-assistance/sessions/${sessionId}/messages`, {
      message,
      clientMessageId
    });
  },
  confirmSummary: (sessionId: string | number) => {
    return apiClient.post(`/api/customer/legal-assistance/sessions/${sessionId}/confirm`);
  },
  nextStep: (sessionId: string | number, action: string) => {
    return apiClient.post(`/api/customer/legal-assistance/sessions/${sessionId}/next-step`, { action });
  }
};
