import { useEffect, useState } from "react";
import productService from "../../services/productService";
import categoryService from "../../services/categoryService";
import supplierService from "../../services/supplierService";
import { isAdmin } from "../../utils/authUtil";

function ProductPage() {
  /*
    ============================================================
    MODULE 9 — PRODUCT MANAGEMENT UI

    Completed in this file:
    Stage 4 — Add Product Form
    Stage 5 — Edit Product
    Stage 6 — Delete Product
    Stage 7 — ADMIN / STAFF Role-Based Product Buttons

    Important:
    - Product create needs quantity.
    - Product edit does NOT edit quantity.
    - Quantity belongs to Inventory module.
    - Product description is supported by backend.
    ============================================================
  */

  // ADMIN can add/edit/delete. STAFF can only view.
  const canManageProducts = isAdmin();

  // Main data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  /*
    ADD PRODUCT FORM STATE

    quantity is included only here because backend requires quantity
    when creating a product.
  */
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    minimumStock: "",
    quantity: "",
    categoryId: "",
    supplierId: "",
  });

  /*
    EDIT PRODUCT FORM STATE

    quantity is not included here because stock quantity must be changed
    from Inventory page, not Product edit.
  */
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    minimumStock: "",
    categoryId: "",
    supplierId: "",
  });

  // UI control states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  // Loading/action states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  // Message states
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // STAGE 8 — Search keyword state
const [searchKeyword, setSearchKeyword] = useState("");


  // Format product price for table display
  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "₹0.00";
    }

    return `₹${Number(price).toFixed(2)}`;
  };

  /*
  ============================================================
  STAGE 8 — SEARCH PRODUCTS BY NAME OR SKU
  ============================================================
*/
const filteredProducts = products.filter((product) => {
  const keyword = searchKeyword.toLowerCase().trim();

  if (keyword === "") {
    return true;
  }

  const productName = product.name?.toLowerCase() || "";
  const productSku = product.sku?.toLowerCase() || "";

  return productName.includes(keyword) || productSku.includes(keyword);
});

  /*
    Load all data needed for Product page:
    1. Products for table
    2. Categories for dropdown
    3. Suppliers for dropdown
  */
  const loadProductPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [productResponse, categoryResponse, supplierResponse] =
        await Promise.all([
          productService.getAllProducts(),
          categoryService.getAllCategories(),
          supplierService.getAllSuppliers(),
        ]);

      setProducts(productResponse.data || []);
      setCategories(categoryResponse.data || []);
      setSuppliers(supplierResponse.data || []);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to load product page data.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load data when page opens
  useEffect(() => {
    loadProductPageData();
  }, []);

  // Handles Add Product form input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handles Edit Product row input changes
  const handleEditInputChange = (event) => {
    const { name, value } = event.target;

    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Reset Add Product form
  const resetAddForm = () => {
    setFormData({
      name: "",
      description: "",
      sku: "",
      price: "",
      minimumStock: "",
      quantity: "",
      categoryId: "",
      supplierId: "",
    });

    setFormError("");
  };

  // Reset Edit Product form
  const resetEditForm = () => {
    setEditFormData({
      name: "",
      description: "",
      sku: "",
      price: "",
      minimumStock: "",
      categoryId: "",
      supplierId: "",
    });

    setEditingProductId(null);
    setFormError("");
  };

  // Cancel Add Product
  const handleCancelAdd = () => {
    resetAddForm();
    setShowAddForm(false);
  };

  /*
    Common validation for create and update.

    These fields are required for both:
    name, description, sku, price, minimumStock, categoryId, supplierId
  */
  const validateProductBaseData = (productData) => {
    if (productData.name.trim() === "") {
      return "Product name is required.";
    }

    if (productData.description.trim() === "") {
      return "Product description is required.";
    }

    if (productData.sku.trim() === "") {
      return "Product SKU is required.";
    }

    if (productData.price === "") {
      return "Product price is required.";
    }

    if (Number(productData.price) < 0) {
      return "Product price cannot be negative.";
    }

    if (productData.minimumStock === "") {
      return "Minimum stock is required.";
    }

    if (Number(productData.minimumStock) < 0) {
      return "Minimum stock cannot be negative.";
    }

    if (productData.categoryId === "") {
      return "Category is required.";
    }

    if (productData.supplierId === "") {
      return "Supplier is required.";
    }

    return "";
  };

  /*
    Extra validation for create only.

    Backend requires quantity during product creation.
  */
  const validateCreateProductData = (productData) => {
    const baseValidationMessage = validateProductBaseData(productData);

    if (baseValidationMessage) {
      return baseValidationMessage;
    }

    if (productData.quantity === "") {
      return "Initial quantity is required.";
    }

    if (Number(productData.quantity) < 0) {
      return "Initial quantity cannot be negative.";
    }

    return "";
  };

  /*
    Request body for POST /api/products

    Includes quantity.
  */
  const buildCreateProductRequest = (productData) => {
    return {
      name: productData.name.trim(),
      description: productData.description.trim(),
      sku: productData.sku.trim(),
      price: Number(productData.price),
      minimumStock: Number(productData.minimumStock),
      quantity: Number(productData.quantity),
      categoryId: Number(productData.categoryId),
      supplierId: Number(productData.supplierId),
    };
  };

  /*
    Request body for PUT /api/products/{id}

    Does not include quantity.
  */
  const buildUpdateProductRequest = (productData) => {
    return {
      name: productData.name.trim(),
      description: productData.description.trim(),
      sku: productData.sku.trim(),
      price: Number(productData.price),
      minimumStock: Number(productData.minimumStock),
      categoryId: Number(productData.categoryId),
      supplierId: Number(productData.supplierId),
    };
  };

  /*
    ============================================================
    STAGE 4 — ADD PRODUCT
    ============================================================
  */
  const handleCreateProduct = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const validationMessage = validateCreateProductData(formData);

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSaving(true);

      const productData = buildCreateProductRequest(formData);

      await productService.createProduct(productData);

      setSuccessMessage("Product created successfully.");
      resetAddForm();
      setShowAddForm(false);
      await loadProductPageData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        Object.values(error.response?.data || {})[0] ||
        "Unable to create product.";

      setFormError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /*
    ============================================================
    STAGE 5 — START EDIT PRODUCT
    ============================================================
  */
  const handleStartEdit = (product) => {
    setShowAddForm(false);
    setSuccessMessage("");
    setFormError("");

    setEditingProductId(product.id);

    setEditFormData({
      name: product.name || "",
      description: product.description || "",
      sku: product.sku || "",
      price: product.price ?? "",
      minimumStock: product.minimumStock ?? "",
      categoryId: product.category?.id || "",
      supplierId: product.supplier?.id || "",
    });
  };

  /*
    ============================================================
    STAGE 5 — UPDATE PRODUCT
    ============================================================
  */
  const handleUpdateProduct = async (productId) => {
    setFormError("");
    setSuccessMessage("");

    const validationMessage = validateProductBaseData(editFormData);

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setUpdating(true);

      const productData = buildUpdateProductRequest(editFormData);

      await productService.updateProduct(productId, productData);

      setSuccessMessage("Product updated successfully.");
      resetEditForm();
      await loadProductPageData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        Object.values(error.response?.data || {})[0] ||
        "Unable to update product.";

      setFormError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  /*
    ============================================================
    STAGE 6 — DELETE PRODUCT
    ============================================================

    Product delete may be blocked by backend if product is connected to:
    - inventory
    - stock movements
    - sales history

    That is correct business protection.
  */
  const handleDeleteProduct = async (product) => {
    setFormError("");
    setSuccessMessage("");

    const confirmed = window.confirm(
      `Are you sure you want to delete product "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProductId(product.id);

      await productService.deleteProduct(product.id);

      setSuccessMessage("Product deleted successfully.");
      await loadProductPageData();
    } catch (error) {
      const errorMessage =
        error.response?.status === 409
          ? "Product cannot be deleted because it is connected to inventory, stock movements, or sales history."
          : error.response?.data?.message || "Unable to delete product.";

      setFormError(errorMessage);
    } finally {
      setDeletingProductId(null);
    }
  };

  /*
    ================================
    LOADING UI
    ================================
  */
  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="mb-0 text-muted">Loading product page data...</p>
        </div>
      </div>
    );
  }

  /*
    ================================
    ERROR UI
    ================================
  */
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <div className="d-flex justify-content-between align-items-center">
          <span>{error}</span>

          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadProductPageData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /*
    ================================
    MAIN UI
    ================================
  */
  return (
    <div>
      {/* STAGE 7 — STAFF INFO ALERT */}
      {!canManageProducts && (
        <div className="alert alert-info" role="alert">
          You are logged in as STAFF. You can view products, but only ADMIN can
          add, edit, or delete products.
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {formError && !showAddForm && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      {/* CATEGORY WARNING */}
      {categories.length === 0 && (
        <div className="alert alert-warning" role="alert">
          No categories found. Create at least one category before adding a
          product.
        </div>
      )}

      {/* SUPPLIER WARNING */}
      {suppliers.length === 0 && (
        <div className="alert alert-warning" role="alert">
          No suppliers found. Create at least one supplier before adding a
          product.
        </div>
      )}

      {/* STAGE 7 — ADD PRODUCT BUTTON ONLY FOR ADMIN */}
      {canManageProducts && (
        <div className="d-flex justify-content-end mb-3">
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowAddForm(true);
              resetEditForm();
              setSuccessMessage("");
              setFormError("");
            }}
            disabled={
              showAddForm || categories.length === 0 || suppliers.length === 0
            }
          >
            <i className="bi bi-plus-circle me-1"></i>
            Add Product
          </button>
        </div>
      )}

      {/* STAGE 4 — ADD PRODUCT FORM ONLY FOR ADMIN */}
      {canManageProducts && showAddForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h6 className="mb-3">Add New Product</h6>

            {formError && (
              <div className="alert alert-danger" role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct}>
              <div className="row g-3">
                {/* Product Name */}
                <div className="col-md-6">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Example: Samsung Galaxy"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>

                {/* SKU */}
                <div className="col-md-6">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    className="form-control"
                    placeholder="Example: SAM-GAL-001"
                    value={formData.sku}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>

                {/* Description */}
                <div className="col-md-12">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    name="description"
                    className="form-control"
                    placeholder="Example: 512GB Black 5G Smartphone"
                    value={formData.description}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>

                {/* Price */}
                <div className="col-md-4">
                  <label className="form-label">Price</label>
                  <input
                    type="number"
                    name="price"
                    className="form-control"
                    placeholder="Example: 25000"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={saving}
                    min="0"
                  />
                </div>

                {/* Minimum Stock */}
                <div className="col-md-4">
                  <label className="form-label">Minimum Stock</label>
                  <input
                    type="number"
                    name="minimumStock"
                    className="form-control"
                    placeholder="Example: 5"
                    value={formData.minimumStock}
                    onChange={handleInputChange}
                    disabled={saving}
                    min="0"
                  />
                </div>

                {/* Initial Quantity */}
                <div className="col-md-4">
                  <label className="form-label">Initial Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    className="form-control"
                    placeholder="Example: 10"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    disabled={saving}
                    min="0"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="col-md-6">
                  <label className="form-label">Category</label>
                  <select
                    name="categoryId"
                    className="form-select"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    disabled={saving}
                  >
                    <option value="">Select Category</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier Dropdown */}
                <div className="col-md-6">
                  <label className="form-label">Supplier</label>
                  <select
                    name="supplierId"
                    className="form-select"
                    value={formData.supplierId}
                    onChange={handleInputChange}
                    disabled={saving}
                  >
                    <option value="">Select Supplier</option>

                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Form Buttons */}
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleCancelAdd}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAGE 8 — PRODUCT SEARCH */}
<div className="card border-0 shadow-sm mb-3">
  <div className="card-body">
    <div className="row g-3 align-items-end">
      <div className="col-md-8">
        <label className="form-label">Search Product</label>
        <input
          type="text"
          className="form-control"
          placeholder="Search by product name or SKU"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
        />
      </div>

      <div className="col-md-4">
        <button
          className="btn btn-outline-secondary w-100"
          onClick={() => setSearchKeyword("")}
          disabled={searchKeyword.trim() === ""}
        >
          Clear Search
        </button>
      </div>
    </div>

    <div className="small text-muted mt-2">
      Showing {filteredProducts.length} of {products.length} products
    </div>
  </div>
</div>


      {/* PRODUCT TABLE */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
         {filteredProducts.length === 0 ?  (
            <div className="text-center py-5">
              <div className="fs-1 text-muted">
                <i className="bi bi-box-seam"></i>
              </div>
              <h6 className="mt-3">
  {products.length === 0 ? "No products found" : "No matching products found"}
</h6>

<p className="text-muted mb-0">
  {products.length === 0
    ? "Create your first product to start managing inventory."
    : "Try searching with another product name or SKU."}
</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "70px" }}>ID</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Supplier</th>
                    <th>Price</th>
                    <th>Minimum Stock</th>

                    {/* STAGE 7 — ACTIONS COLUMN ONLY FOR ADMIN */}
                    {canManageProducts && (
                      <th style={{ width: "240px" }}>Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                 {filteredProducts.map((product) => {
                    const isEditing = editingProductId === product.id;
                    const isDeleting = deletingProductId === product.id;

                    return (
                      <tr key={product.id}>
                        {/* ID */}
                        <td>{product.id}</td>

                        {/* Name + Description */}
                        <td>
                          {isEditing ? (
                            <div>
                              <input
                                type="text"
                                name="name"
                                className="form-control form-control-sm mb-2"
                                value={editFormData.name}
                                onChange={handleEditInputChange}
                                disabled={updating}
                              />

                              <input
                                type="text"
                                name="description"
                                className="form-control form-control-sm"
                                value={editFormData.description}
                                onChange={handleEditInputChange}
                                disabled={updating}
                                placeholder="Description"
                              />
                            </div>
                          ) : (
                            <div>
                              <strong>{product.name}</strong>

                              {product.description && (
                                <div className="small text-muted">
                                  {product.description}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* SKU */}
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              name="sku"
                              className="form-control form-control-sm"
                              value={editFormData.sku}
                              onChange={handleEditInputChange}
                              disabled={updating}
                            />
                          ) : (
                            <span className="badge text-bg-light">
                              {product.sku}
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td>
                          {isEditing ? (
                            <select
                              name="categoryId"
                              className="form-select form-select-sm"
                              value={editFormData.categoryId}
                              onChange={handleEditInputChange}
                              disabled={updating}
                            >
                              <option value="">Select Category</option>

                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            product.category?.name || "No category"
                          )}
                        </td>

                        {/* Supplier */}
                        <td>
                          {isEditing ? (
                            <select
                              name="supplierId"
                              className="form-select form-select-sm"
                              value={editFormData.supplierId}
                              onChange={handleEditInputChange}
                              disabled={updating}
                            >
                              <option value="">Select Supplier</option>

                              {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                  {supplier.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            product.supplier?.name || "No supplier"
                          )}
                        </td>

                        {/* Price */}
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              name="price"
                              className="form-control form-control-sm"
                              value={editFormData.price}
                              onChange={handleEditInputChange}
                              disabled={updating}
                              min="0"
                            />
                          ) : (
                            formatPrice(product.price)
                          )}
                        </td>

                        {/* Minimum Stock */}
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              name="minimumStock"
                              className="form-control form-control-sm"
                              value={editFormData.minimumStock}
                              onChange={handleEditInputChange}
                              disabled={updating}
                              min="0"
                            />
                          ) : (
                            product.minimumStock
                          )}
                        </td>

                        {/* STAGE 7 — EDIT/DELETE ONLY FOR ADMIN */}
                        {canManageProducts && (
                          <td>
                            {isEditing ? (
                              <div className="table-action-area">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleUpdateProduct(product.id)}
                                  disabled={updating}
                                >
                                  {updating ? "Saving..." : "Save"}
                                </button>

                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={resetEditForm}
                                  disabled={updating}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="table-action-area">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => handleStartEdit(product)}
                                  disabled={isDeleting}
                                >
                                  <i className="bi bi-pencil me-1"></i>
                                  Edit
                                </button>

                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteProduct(product)}
                                  disabled={isDeleting}
                                >
                                  <i className="bi bi-trash me-1"></i>
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;