import apiClient from "./apiClient";

const getAllStockMovements = () => {
  return apiClient.get("/api/stock-movements");
};

const getStockMovementsByProductId = (productId) => {
  return apiClient.get(`/api/stock-movements/product/${productId}`);
};

const stockMovementService = {
  getAllStockMovements,
  getStockMovementsByProductId,
};

export default stockMovementService;