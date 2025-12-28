import { create } from "zustand";
import AuthService from "../services/auth.service";

// Map backend roles (uppercase) → frontend roles (lowercase)
const roleMap = {
  ADMIN: "admin",
  PROPOSAL_MANAGER: "proposal_manager",
  REVIEWER: "reviewer",
  WRITER: "writer",
};

export const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  isAuthenticated: false,
  loading: true,

  setTokens: (access, refresh) => {
    if (access) localStorage.setItem("accessToken", access);
    if (refresh) localStorage.setItem("refreshToken", refresh);

    set({
      accessToken: access,
      refreshToken: refresh,
    });
  },

  clearTokens: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  login: async (credentials) => {
    const res = await AuthService.login(credentials);
    const { access, refresh } = res.data;

    get().setTokens(access, refresh);

    const me = await AuthService.me();
    set({
      user: me.data,
      role: roleMap[me.data.role] || me.data.role, // normalize role
      isAuthenticated: true,
    });

    return res;
  },

  register: async (data) => {
    return AuthService.register(data);
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    set({
      user: null,
      role: null,
      isAuthenticated: false,
    });
  },

  initialize: async () => {
    const token = get().accessToken;

    if (!token) {
      set({ loading: false });
      return;
    }

    try {
      const res = await AuthService.me();

      set({
        user: res.data,
        role: roleMap[res.data.role] || res.data.role, // normalize
        isAuthenticated: true,
        loading: false,
      });
    } catch (e) {
      get().clearTokens();
      set({
        user: null,
        role: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },
}));
