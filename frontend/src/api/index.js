import api from './client';

export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (email, password) => {
    const res = await api.post('/auth/register', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const profileApi = {
  getProfile: async () => {
    const res = await api.get('/profile/');
    return res.data;
  },
  saveProfile: async (data) => {
    const res = await api.post('/profile/', data);
    return res.data;
  },
};

export const dashboardApi = {
  getDashboard: async () => {
    const res = await api.get('/dashboard/');
    return res.data;
  },
  getCoverage: async () => {
    const res = await api.get('/dashboard/coverage');
    return res.data;
  },
  getStreaks: async () => {
    const res = await api.get('/dashboard/streaks');
    return res.data;
  },
};

export const workoutApi = {
  getPlans: async () => {
    const res = await api.get('/workout/plans');
    return res.data;
  },
  createPlan: async (plan) => {
    const res = await api.post('/workout/plans', plan);
    return res.data;
  },
  activatePlan: async (planId) => {
    const res = await api.put(`/workout/plans/${planId}/activate`);
    return res.data;
  },
  getTodayPlan: async () => {
    const res = await api.get('/workout/today');
    return res.data;
  },
  getPreviousExercise: async (exerciseName) => {
    const res = await api.get(`/workout/previous/${encodeURIComponent(exerciseName)}`);
    return res.data;
  },
  logWorkout: async (log) => {
    const res = await api.post('/workout/logs', log);
    return res.data;
  },
  getLogs: async () => {
    const res = await api.get('/workout/logs');
    return res.data;
  },
};

export const bodyApi = {
  logWeight: async (weight_kg, log_date = null) => {
    const res = await api.post('/body/weight', { weight_kg: parseFloat(weight_kg), log_date });
    return res.data;
  },
  getWeights: async (days = 90) => {
    const res = await api.get(`/body/weight?days=${days}`);
    return res.data;
  },
  uploadPhoto: async (formData) => {
    const res = await api.post('/body/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getPhotos: async () => {
    const res = await api.get('/body/photos');
    return res.data;
  },
  comparePhotos: async (date1, date2) => {
    const res = await api.get(`/body/compare?date1=${date1}&date2=${date2}`);
    return res.data;
  },
};

export const nutritionApi = {
  getNutrition: async (dateStr) => {
    const res = await api.get(`/nutrition/${dateStr}`);
    return res.data;
  },
  addMeal: async (meal, log_date = null) => {
    const res = await api.post('/nutrition/meal', meal, { params: { log_date } });
    return res.data;
  },
  deleteMeal: async (mealId) => {
    const res = await api.delete(`/nutrition/meal/${mealId}`);
    return res.data;
  },
  aiEstimate: async (description, meal_type = 'snack', log_date = null) => {
    const res = await api.post('/nutrition/ai-estimate', { description, meal_type, log_date });
    return res.data;
  },
};

export const sorenessApi = {
  logSoreness: async (sore_muscles, severity = 3, notes = '') => {
    const res = await api.post('/soreness/', { sore_muscles, severity, notes });
    return res.data;
  },
  getSoreness: async () => {
    const res = await api.get('/soreness/');
    return res.data;
  },
  replan: async (sore_muscles, severity = 3) => {
    const res = await api.post('/soreness/replan', { sore_muscles, severity });
    return res.data;
  },
};

export const aiApi = {
  chat: async (content) => {
    const res = await api.post('/ai/chat', { content });
    return res.data;
  },
  getHistory: async () => {
    const res = await api.get('/ai/chat');
    return res.data;
  },
  getDailySummary: async () => {
    const res = await api.get('/ai/daily-summary');
    return res.data;
  },
  getWeeklySummary: async () => {
    const res = await api.get('/ai/weekly-summary');
    return res.data;
  },
};
