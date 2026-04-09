const DB_KEY = 'sprintops_db';

export const storageEngine = {
  get: () => {
    try {
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Error reading from localStorage:", e);
      return null;
    }
  },
  
  set: (data) => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Error writing to localStorage:", e);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.removeItem(DB_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }
};
