import api from './api';

const gamificationService = {
  getMe: async () => {
    const res = await api.get('/gamification/me');
    return res.data;
  },
  
  getStats: async () => {
    const res = await api.get('/gamification/stats');
    return res.data;
  }
};

export default gamificationService;
