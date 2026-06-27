import apiClient from "./apiClient";

const getAllProducts = () => apiClient.get("/api/products");

const getProductById = (productId) => {
  return apiClient.get(`/api/products/${productId}`);
};

const createProduct = (productData) => {
  return apiClient.post("/api/products", productData);
};

const updateProduct = (productId, productData) => {
  return apiClient.put(`/api/products/${productId}`, productData);
};

const deleteProduct = (productId) => {
  return apiClient.delete(`/api/products/${productId}`);
};

const searchProducts = (keyword) => {
  return apiClient.get(`/api/products/search?keyword=${encodeURIComponent(keyword)}`);
};

const productService = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
};

export default productService;