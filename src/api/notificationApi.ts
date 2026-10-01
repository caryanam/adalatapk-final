import apiClient from './apiClient';

export const notificationApi = {
  getNotifications: () => {
    return apiClient.get('/api/notifications');
  },

  getUnreadCount: () => {
    return apiClient.get('/api/notifications/unread-count');
  },

  markAsRead: (notificationId: string | number) => {
    return apiClient.put(`/api/notifications/${notificationId}/read`);
  },

  markAllAsRead: () => {
    return apiClient.put('/api/notifications/read-all');
  },

  deleteNotification: (notificationId: string | number) => {
    return apiClient.delete(`/api/notifications/${notificationId}`);
  },
  
  notifyWaiting: (requestId: string | number) => {
    return apiClient.post(`/api/notifications/notify-waiting/${requestId}`);
  }
};
