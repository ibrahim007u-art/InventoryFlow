import apiClient from "./apiClient";

const login = (email, password) => {
  return apiClient.post("/api/auth/login", {
    email,
    password,
  });
};

const getCurrentUser = () => {
  return apiClient.get("/api/users/me");
};

const authService = {
  login,
  getCurrentUser,
};

export default authService;