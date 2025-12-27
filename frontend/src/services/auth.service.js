import api from "../lib/api";

const AuthService = {
  login(data) {
    return api.post("/auth/login", data);
  },

  register(data) {
    return api.post("/auth/register", data);
  },

  logout() {
    return api.post("/auth/logout");
  },

  refresh(refresh) {
    return api.post("/auth/refresh", { refresh });
  },

  me() {
    return api.get("/auth/me");
  },

  forgotPassword(email) {
    return api.post("/auth/forgot-password", { email });
  },

  resetPassword(data) {
    return api.post("/auth/reset-password", data);
  },
};

export default AuthService;
