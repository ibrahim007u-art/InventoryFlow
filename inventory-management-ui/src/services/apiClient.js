import axios from "axios";
import { getAuthorizationHeader, removeAuthData } from "../utils/authUtil";

const apiClient = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const publicUrls = ["/api/auth/login"];

    const isPublicUrl = publicUrls.some((url) => config.url === url);

    if (!isPublicUrl) {
      const authorizationHeader = getAuthorizationHeader();

      if (authorizationHeader) {
        config.headers.Authorization = authorizationHeader;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      removeAuthData();
    }

    return Promise.reject(error);
  }
);

export default apiClient;