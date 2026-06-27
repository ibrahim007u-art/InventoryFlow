import apiClient from "./apiClient";

const getAllInventory = () => {
  return apiClient.get("/api/inventory");
};

const addStock = (inventoryId, stockData) => {
  return apiClient.put(`/api/inventory/${inventoryId}/add-stock`, stockData);
};

const reduceStock = (inventoryId, stockData) => {
  return apiClient.put(`/api/inventory/${inventoryId}/reduce-stock`, stockData);
};

const getLowStockReport = () => {
  return apiClient.get("/api/inventory/low-stock");
};

const getOutOfStockReport = () => {
  return apiClient.get("/api/inventory/out-of-stock");
};

const getInventoryValueReport = () => {
  return apiClient.get("/api/inventory/inventory-value");
};

const inventoryService = {
  getAllInventory,
  addStock,
  reduceStock,
  getLowStockReport,
  getOutOfStockReport,
  getInventoryValueReport,
};

export default inventoryService;