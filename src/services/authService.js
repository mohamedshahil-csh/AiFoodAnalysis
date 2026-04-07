const API_BASE = '/api/users';

export const authService = {
  async register({ name, email, password, weight, height }) {
    try {
      console.log(`[authService] Registering: ${name} (${email})`);
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, weight, height }),
      });

      console.log(`[authService] Register response status: ${res.status}`);
      const contentType = res.headers.get('content-type');
      console.log(`[authService] Content-Type: ${contentType}`);

      const text = await res.text();
      console.log(`[authService] Raw Response text:`, text);

      if (!res.ok) {
        let errorMessage = 'Registration failed';
        try {
          const data = JSON.parse(text);
          errorMessage = data.message || errorMessage;
        } catch (e) {
          errorMessage = `Server Error: ${res.status} ${res.statusText}. Response was not JSON.`;
        }
        throw new Error(errorMessage);
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('[authService] Registration error:', error);
      throw error;
    }
  },

  async login({ email, password }) {
    try {
      console.log(`[authService] Logging in: ${email}`);
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      console.log(`[authService] Login response status: ${res.status}`);
      const text = await res.text();
      
      if (!res.ok) {
        let errorMessage = 'Login failed';
        try {
          const data = JSON.parse(text);
          errorMessage = data.message || errorMessage;
        } catch (e) {
          errorMessage = `Server Error: ${res.status}. Response was not JSON.`;
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(text);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.error('[authService] Login error:', error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  getUser() {
    const user = localStorage.getItem('authUser');
    return user ? JSON.parse(user) : null;
  },

  async getMe() {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch profile');
    // Update cached user
    localStorage.setItem('authUser', JSON.stringify(data));
    return data;
  },



  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },
  async updateProfile(updatedData) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const user = this.getUser();
    if (!user?.id) throw new Error('User not found');

    const res = await fetch(`${API_BASE}/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Update failed');

    // Return the response (usually {message: '...'})
    return data;
  },

  async getLatestProfile(userId) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`/api/profile/latest/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) return null; // Or handle error
    return data;
  },

  async saveProfile(profileData) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`/api/profile`, {
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
    const res = await fetch(`/api/profile/${userId}`, {
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

  async getLatestProfile(userId) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`/api/profile/latest/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch latest profile');
    return data;
  },

  async saveMeal(mealData) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`/api/meal`, {
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
    const res = await fetch(`/api/meal/${userId}`, {
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
    const res = await fetch(`/api/meal/latest-limit/${userId}?limit=${limit}`, {
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
