import apiClient from './apiClient';

export const lawyerApi = {
  registerStep1: (accountData: any) => {
    return apiClient.post('/api/lawyers/register/step1', accountData);
  },

  getLawyerById: (id: string | number) => {
    const validId = id || 1;
    return apiClient.get(`/api/lawyers/register/${validId}`);
  },

  updateStep2: (lawyerId: string | number, profData: any) => {
    const validId = lawyerId || 1;
    return apiClient.put(`/api/lawyers/register/${validId}/step2`, profData);
  },

  uploadDocument: (lawyerId: string | number, documentType: string, file: any) => {
    const validId = lawyerId || 1;
    const formData = new FormData();
    formData.append('documentType', documentType);
    
    // file should be an object with uri, name, and type properties in React Native
    formData.append('file', {
      uri: file.uri,
      name: file.fileName || file.name || 'document.jpg',
      type: file.type || 'image/jpeg',
    } as any);
    
    return apiClient.post(`/api/lawyers/register/${validId}/step3`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updateStep4: (lawyerId: string | number, amountOrRate: any) => {
    const validId = lawyerId || 1;
    let payload = {};
    if (typeof amountOrRate === 'number' || (!isNaN(amountOrRate) && !String(amountOrRate).startsWith('RATE_'))) {
      payload = { amount: parseInt(amountOrRate, 10) || 99 };
    } else {
      payload = { consultationRate: amountOrRate || 'RATE_99' };
    }
    return apiClient.put(`/api/lawyers/register/${validId}/step4`, payload);
  },

  updateStep5: (lawyerId: string | number, upiId: string) => {
    const validId = lawyerId || 1;
    return apiClient.put(`/api/lawyers/register/${validId}/step5`, { upiId });
  },

  submitApplication: (lawyerId: string | number) => {
    const validId = lawyerId || 1;
    return apiClient.put(`/api/lawyers/register/${validId}/submit`);
  },

  getApprovedLawyers: () => {
    return apiClient.get('/api/lawyers/register/directory');
  },

  getEarnings: (lawyerId: string | number) => {
    const validId = lawyerId || 1;
    return apiClient.get(`/api/lawyers/${validId}/earnings`);
  },

  getRatings: (lawyerId: string | number) => {
    const validId = lawyerId || 1;
    return apiClient.get(`/api/lawyers/${validId}/ratings`);
  },

  login: (identifier: string, password: string) => {
    return apiClient.post('/api/lawyers/login', { identifier, password });
  }
};
