import { create } from "zustand";

// Safe local storage helpers
const getLocalStorageJSON = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return null;
  }
};

const setLocalStorageJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
};

const initialToken = localStorage.getItem("clinicbook_token") || null;
const initialClinic = getLocalStorageJSON("clinicbook_clinic") || null;

/**
 * Zustand authentication store managing the clinic session
 */
export const useAuthStore = create((set) => ({
  clinic: initialClinic,
  token: initialToken,
  isLoggedIn: !!initialToken,

  /**
   * Set active authentication credentials and cache to localStorage
   */
  setAuth: (clinic, token) => {
    set({ clinic, token, isLoggedIn: true });
    if (token) {
      localStorage.setItem("clinicbook_token", token);
    }
    if (clinic) {
      setLocalStorageJSON("clinicbook_clinic", clinic);
    }
  },

  /**
   * Clear authentication state and purge cache from localStorage
   */
  clearAuth: () => {
    set({ clinic: null, token: null, isLoggedIn: false });
    localStorage.removeItem("clinicbook_token");
    localStorage.removeItem("clinicbook_clinic");
  },
}));
