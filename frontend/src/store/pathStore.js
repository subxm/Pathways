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

  generatePath: async (skill, level, goal, studyHours, learningStyle) => {
    set({ isGeneratingPath: true });
    try {
      const res = await api.post('/api/paths', { skill, level, goal, studyHours, learningStyle });
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
    // 1. Capture the previous state for potential rollback
    const previousPaths = get().paths;
    const previousCurrentPath = get().currentPath;

    // Helper function to update a single path object optimistically
    const updatePathOptimistically = (pathObj) => {
      if (!pathObj || pathObj.id !== pathId) return pathObj;

      let topicFound = false;
      const updatedWeeks = pathObj.weeks?.map((week) => {
        const updatedTopics = week.topics?.map((topic) => {
          if (topic.id === topicId) {
            topicFound = true;
            return {
              ...topic,
              completed: completed,
              isCompleted: completed,
            };
          }
          return topic;
        });
        return { ...week, topics: updatedTopics };
      });

      if (!topicFound) return pathObj;

      // Re-calculate completedTopicsCount based on the updated weeks
      let count = 0;
      updatedWeeks.forEach((w) => {
        w.topics?.forEach((t) => {
          if (t.completed || t.isCompleted) {
            count++;
          }
        });
      });

      return {
        ...pathObj,
        weeks: updatedWeeks,
        completedTopicsCount: count,
      };
    };

    // 2. Apply optimistic update to local state immediately
    set((state) => {
      const updatedPaths = state.paths.map((p) => updatePathOptimistically(p));
      const updatedCurrentPath = updatePathOptimistically(state.currentPath);
      return { paths: updatedPaths, currentPath: updatedCurrentPath };
    });

    try {
      // 3. Issue the API request asynchronously
      const res = await api.post(`/api/paths/${pathId}/topics/${topicId}/toggle?completed=${completed}`);
      
      // 4. Confirm and synchronize state with the server's response
      set((state) => {
        const updatedPaths = state.paths.map((p) => (p.id === pathId ? res.data : p));
        const updatedCurrentPath = state.currentPath && state.currentPath.id === pathId ? res.data : state.currentPath;
        return { paths: updatedPaths, currentPath: updatedCurrentPath };
      });
      return true;
    } catch (err) {
      console.error("Failed to toggle topic:", err);
      // 5. Rollback to the previous state on failure
      set({ paths: previousPaths, currentPath: previousCurrentPath });
      return false;
    }
  },

  clearPathsState: () => {
    set({ paths: [], currentPath: null, isLoadingPaths: false, isGeneratingPath: false });
  }
}));
