import api from "../lib/api";

const AuthService = {
  login(data) {
    return api.post("/users/login/", data);
  },

  register(data) {
    return api.post("/users/register/", data);
  },
  
  refresh(refresh) {
    return api.post("/users/refresh/", { refresh });
  },

  me() {
    return api.get("/users/me/");
  },

  forgotPassword(email) {
    return api.post("/users/forgot-password/", { email });
  },

  resetPassword(data) {
    return api.post("/users/reset-password/", data);
  },
};

export default AuthService;
