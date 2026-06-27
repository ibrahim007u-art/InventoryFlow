import apiClient from "./apiClient";

const createSale = (saleData) => {
  return apiClient.post("/api/sales", saleData);
};

const getAllSales = () => {
  return apiClient.get("/api/sales");
};

const getSaleById = (saleId) => {
  return apiClient.get(`/api/sales/${saleId}`);
};

const salesService = {
  createSale,
  getAllSales,
  getSaleById,
};

export default salesService;