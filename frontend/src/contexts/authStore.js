import { create } from "zustand";
import AuthService from "../services/auth.service";

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

    const { access, refresh, user } = res.data;

    get().setTokens(access, refresh);

    if (user) {
      set({
        user,
        role: user.role,
        isAuthenticated: true,
      });
    } else {
      // fallback → fetch user
      const me = await AuthService.me();
      set({
        user: me.data,
        role: me.data.role,
        isAuthenticated: true,
      });
    }

    return res;
  },

  register: async (data) => {
    return AuthService.register(data);
  },

  logout: async () => {
    try {
      await AuthService.logout();
    } catch (_) {}

    get().clearTokens();

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
        role: res.data.role,
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
