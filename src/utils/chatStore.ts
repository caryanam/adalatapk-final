import AsyncStorage from '@react-native-async-storage/async-storage';
import { consultationApi } from '../api/consultationApi';

const CHAT_PREFIX = 'adalat_chat_msgs_';
const TIMER_PREFIX = 'adalat_timer_start_';

export const getChatMessages = async (consultationId: string | number) => {
  if (!consultationId) return [];
  try {
    const raw = await AsyncStorage.getItem(`${CHAT_PREFIX}${consultationId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}

  return [
    {
      id: 1,
      sender: 'CUSTOMER',
      text: 'Hello Advocate, I have submitted my legal intake details and AI assessment report. Please advise.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];
};

export const sendChatMessage = async (consultationId: string | number, sender: string, text: string, file: any = null) => {
  if (!consultationId) return [];
  if (!text.trim() && !file) return await getChatMessages(consultationId);

  let savedDto: any = null;

  try {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (text.trim()) {
        formData.append('text', text.trim());
        formData.append('message', text.trim());
      }

      if (sender === 'CUSTOMER') {
        const res = await consultationApi.uploadConsultationAttachmentCustomer(consultationId, formData);
        savedDto = res?.data?.data || res?.data;
      }
    } else {
      if (sender === 'CUSTOMER') {
        const res = await consultationApi.sendConsultationMessageCustomer(consultationId, text.trim());
        savedDto = res?.data?.data || res?.data;
      }
    }
  } catch (e) {
    console.warn('Backend REST API save error:', e);
  }

  const current = await getChatMessages(consultationId);
  const newMsg = {
    id: savedDto?.id || Date.now(),
    sender,
    text: savedDto?.message || text.trim(),
    attachmentUrl: savedDto?.attachmentUrl || null,
    attachmentName: savedDto?.attachmentName || file?.name || null,
    attachmentType: savedDto?.attachmentType || file?.type || null,
    attachmentSize: savedDto?.attachmentSize || file?.size || null,
    status: (savedDto?.status || 'SENT').toUpperCase(),
    timestamp: savedDto?.createdAt 
        ? new Date(savedDto.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  const updated = [...current, newMsg];
  try {
    await AsyncStorage.setItem(`${CHAT_PREFIX}${consultationId}`, JSON.stringify(updated));
  } catch (e) {}

  return updated;
};

export const resetConsultationTimer = async (consultationId: string | number) => {
  if (!consultationId) return;
  const key = `${TIMER_PREFIX}${consultationId}`;
  await AsyncStorage.setItem(key, String(Date.now()));
};

export const getSharedTimerSeconds = async (consultationId: string | number, totalDurationSeconds: number = 600) => {
  if (!consultationId) return totalDurationSeconds;
  const key = `${TIMER_PREFIX}${consultationId}`;
  try {
    let startTime = await AsyncStorage.getItem(key);
    if (!startTime) {
      startTime = String(Date.now());
      await AsyncStorage.setItem(key, startTime);
    }
    const elapsedSeconds = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
    const remaining = totalDurationSeconds - elapsedSeconds;
    return remaining > 0 ? remaining : 0;
  } catch (e) {
    return totalDurationSeconds;
  }
};
