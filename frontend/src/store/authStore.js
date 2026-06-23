import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/api/auth/me');
      set({ user: res.data, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  registerUser: async (username, email, password) => {
    set({ isLoading: true });
    try {
      await api.post('/api/auth/register', { username, email, password });
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { 
        success: false, 
        message: err.response?.data?.message || 'Registration failed' 
      };
    }
  },

  loginUser: async (username, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/api/auth/login', { username, password });
      set({ user: res.data, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { 
        success: false, 
        message: err.response?.data?.message || 'Invalid credentials' 
      };
    }
  },

  loginWithGoogle: async (email, sub) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/api/auth/google', { email, sub });
      set({ user: res.data, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { 
        success: false, 
        message: err.response?.data?.message || 'Google authentication failed' 
      };
    }
  },

  logoutUser: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  // Direct state reset without network request (used by Axios interceptor)
  resetAuthState: () => {
    set({ user: null, isAuthenticated: false });
  }
}));
