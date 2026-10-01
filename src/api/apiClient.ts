import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.10.246:8082';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('adalat_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use((response) => {
  return response.data;
}, async (error) => {
  if (error.response?.status === 401) {
    await AsyncStorage.removeItem('adalat_token');
  }
  const errorMsg = error.response?.data?.message || error.response?.data || error.message || 'Server request failed';
  const err = new Error(errorMsg) as any;
  err.status = error.response?.status;
  return Promise.reject(err);
});

const client = {
  get: (url: string, config?: any): Promise<any> => apiClient.get(url, config),
  post: (url: string, data?: any, config?: any): Promise<any> => apiClient.post(url, data, config),
  put: (url: string, data?: any, config?: any): Promise<any> => apiClient.put(url, data, config),
  delete: (url: string, config?: any): Promise<any> => apiClient.delete(url, config),
};

export default client;
