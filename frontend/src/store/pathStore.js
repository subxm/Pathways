import { create } from 'zustand';
import api from '../api/axios';

export const usePathStore = create((set, get) => ({
  paths: [],
  currentPath: null,
  isLoadingPaths: false,
  isGeneratingPath: false,

  fetchPaths: async () => {
    set({ isLoadingPaths: true });
    try {
      const res = await api.get('/api/paths');
      set({ paths: res.data, isLoadingPaths: false });
    } catch (err) {
      set({ isLoadingPaths: false });
    }
  },

  fetchPathDetails: async (pathId) => {
    set({ isLoadingPaths: true });
    try {
      const res = await api.get(`/api/paths/${pathId}`);
      set({ currentPath: res.data, isLoadingPaths: false });
      return res.data;
    } catch (err) {
      set({ isLoadingPaths: false });
      return null;
    }
  },

  generatePath: async (skill, level, goal) => {
    set({ isGeneratingPath: true });
    try {
      const res = await api.post('/api/paths', { skill, level, goal });
      set((state) => ({
        paths: [res.data, ...state.paths],
        currentPath: res.data,
        isGeneratingPath: false,
      }));
      return { success: true, path: res.data };
    } catch (err) {
      set({ isGeneratingPath: false });
      return { 
        success: false, 
        message: err.response?.data?.message || 'Failed to generate curriculum' 
      };
    }
  },

  toggleTopic: async (pathId, topicId, completed) => {
    try {
      const res = await api.post(`/api/paths/${pathId}/topics/${topicId}/toggle?completed=${completed}`);
      
      // Update both currentPath and the list of paths
      set((state) => {
        const updatedPaths = state.paths.map((p) => (p.id === pathId ? res.data : p));
        const updatedCurrentPath = state.currentPath && state.currentPath.id === pathId ? res.data : state.currentPath;
        return { paths: updatedPaths, currentPath: updatedCurrentPath };
      });
      return true;
    } catch (err) {
      console.error("Failed to toggle topic:", err);
      return false;
    }
  }
}));
