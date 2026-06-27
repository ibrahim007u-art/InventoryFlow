import apiClient from "./apiClient";

const getAllSuppliers = () => {
  return apiClient.get("/api/suppliers");
};

const getSupplierById = (supplierId) => {
  return apiClient.get(`/api/suppliers/${supplierId}`);
};

const createSupplier = (supplierData) => {
  return apiClient.post("/api/suppliers", supplierData);
};

const updateSupplier = (supplierId, supplierData) => {
  return apiClient.put(`/api/suppliers/${supplierId}`, supplierData);
};

const deleteSupplier = (supplierId) => {
  return apiClient.delete(`/api/suppliers/${supplierId}`);
};

const supplierService = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};

export default supplierService;