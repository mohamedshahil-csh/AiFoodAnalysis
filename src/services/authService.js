const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://aifoodanalysisbackendnode.onrender.com';
const API_BASE = `${BASE_URL}/api/users`;

export const authService = {
  async register({ name, email, password, weight, height }) {
    try {
      console.log(`[authService] Registering to: ${API_BASE}/register`);
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, weight, height }),
      });
      const data = await res.json();
      console.log(`[authService] Register status: ${res.status}`, data);
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      return data;
    } catch (e) {
      console.error('[authService] Register error:', e);
      throw e;
    }
  },

  async login({ email, password }) {
    try {
      console.log(`[authService] Logging into: ${API_BASE}/login`);
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      console.log(`[authService] Login status: ${res.status}`, data);

      if (!res.ok) throw new Error(data.message || 'Login failed');
      
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      console.log(`[authService] Token saved to localStorage:`, data.token.substring(0, 20) + '...');
      return data;
    } catch (e) {
      console.error('[authService] Login error:', e);
      throw e;
    }
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    console.log(`[authService] Logged out`);
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  getUser() {
    const user = localStorage.getItem('authUser');
    return user ? JSON.parse(user) : null;
  },

  async getMe() {
    try {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');
      console.log(`[authService] getMe with token:`, token.substring(0, 20) + '...');

      const res = await fetch(`${API_BASE}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const text = await res.text();
      console.log(`[authService] getMe status: ${res.status}. Response:`, text);

      if (!res.ok) {
        let msg = 'Failed to fetch profile';
        try { msg = JSON.parse(text).message || msg; } catch(e) {}
        throw new Error(msg);
      }
      
      const data = JSON.parse(text);
      localStorage.setItem('authUser', JSON.stringify(data));
      return data;
    } catch (e) {
      console.error('[authService] getMe error:', e);
      throw e;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  async updateProfile(updatedData) {
    try {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');
      const user = this.getUser();
      if (!user?.id) throw new Error('User not found');

      console.log(`[authService] updateProfile for ${user.id} with token:`, token.substring(0, 20) + '...');

      const res = await fetch(`${API_BASE}/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const text = await res.text();
      console.log(`[authService] updateProfile status: ${res.status}. Response:`, text);

      if (!res.ok) {
        let msg = 'Update failed';
        try { msg = JSON.parse(text).message || msg; } catch(e) {}
        throw new Error(msg);
      }

      return JSON.parse(text);
    } catch (e) {
      console.error('[authService] updateProfile error:', e);
      throw e;
    }
  },

  async getLatestProfile(userId) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${BASE_URL}/api/profile/latest/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) return null;
    return data;
  },

  async saveProfile(profileData) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save vitals');
    return data;
  },

  async getProfileHistory(userId) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${BASE_URL}/api/profile/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch history');
    return data;
  },

  async saveMeal(mealData) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${BASE_URL}/api/meal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(mealData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save meal');
    return data;
  },

  async getMealHistory(userId) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${BASE_URL}/api/meal/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch meal history');
    return data;
  },

  async getLatestMeals(userId, limit = 10) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${BASE_URL}/api/meal/latest-limit/${userId}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch latest meals');
    return data;
  }
};
