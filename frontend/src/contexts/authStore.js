import { create } from "zustand";
import AuthService from "../services/auth.service";

// Map backend roles (uppercase) → frontend roles (lowercase)
const roleMap = {
  ADMIN: "admin",
  PROPOSAL_MANAGER: "proposal_manager",
  REVIEWER: "reviewer",
  WRITER: "writer",
};

// Map backend user_type → frontend format
const userTypeMap = {
  client: "client",
  provider: "provider",
  both: "both",
  admin: "admin",
};

export const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  userType: null, // NEW: client, provider, both, or admin
  profile: null, // NEW: User profile data
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
      role: roleMap[me.data.role] || me.data.role,
      userType: userTypeMap[me.data.user_type] || me.data.user_type,
      profile: me.data.profile || null,
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
      userType: null,
      profile: null,
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
        role: roleMap[res.data.role] || res.data.role,
        userType: userTypeMap[res.data.user_type] || res.data.user_type,
        profile: res.data.profile || null,
        isAuthenticated: true,
        loading: false,
      });
    } catch (e) {
      get().clearTokens();
      set({
        user: null,
        role: null,
        userType: null,
        profile: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  },

  // NEW: Update profile after editing
  updateProfile: (profileData) => {
    set({
      profile: profileData,
    });
  },

  // NEW: Check if user is a client
  isClient: () => {
    const { userType } = get();
    return userType === 'client' || userType === 'both';
  },

  // NEW: Check if user is a provider
  isProvider: () => {
    const { userType } = get();
    return userType === 'provider' || userType === 'both';
  },

  // NEW: Check if user is admin
  isAdmin: () => {
    const { userType, role } = get();
    return userType === 'admin' || role === 'admin';
  },
}));
