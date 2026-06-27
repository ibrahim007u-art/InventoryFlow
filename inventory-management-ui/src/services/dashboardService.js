import apiClient from "./apiClient";

const getDashboardSummary = () => {
  return apiClient.get("/api/dashboard");
};

const dashboardService = {
  getDashboardSummary,
};

export default dashboardService;