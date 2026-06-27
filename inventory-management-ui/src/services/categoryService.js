import apiClient from "./apiClient";

const getAllCategories = () => {
  return apiClient.get("/api/categories");
};

const getCategoryById = (categoryId) => {
  return apiClient.get(`/api/categories/${categoryId}`);
};

const createCategory = (categoryData) => {
  return apiClient.post("/api/categories", categoryData);
};

const updateCategory = (categoryId, categoryData) => {
  return apiClient.put(`/api/categories/${categoryId}`, categoryData);
};

const deleteCategory = (categoryId) => {
  return apiClient.delete(`/api/categories/${categoryId}`);
};

const categoryService = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};

export default categoryService;