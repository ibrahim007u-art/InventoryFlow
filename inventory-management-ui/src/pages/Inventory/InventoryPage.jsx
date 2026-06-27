import { useEffect, useState } from "react";
import inventoryService from "../../services/inventoryService";
import { isAdmin } from "../../utils/authUtil";

function InventoryPage() {
  const canManageInventory = isAdmin();

  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedInventory, setSelectedInventory] = useState(null);
  const [stockActionType, setStockActionType] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "₹0.00";
    }

    return `₹${Number(price).toFixed(2)}`;
  };

  const getStockStatus = (inventory) => {
    const quantity = Number(inventory.quantity ?? 0);
    const minimumStock = Number(inventory.product?.minimumStock ?? 0);

    if (quantity === 0) {
      return "Out Of Stock";
    }

    if (quantity <= minimumStock) {
      return "Low Stock";
    }

    return "In Stock";
  };

  const getStockStatusBadge = (status) => {
    if (status === "Out Of Stock") {
      return "text-bg-danger";
    }

    if (status === "Low Stock") {
      return "text-bg-warning";
    }

    return "text-bg-success";
  };

  // Stage 1: Load inventory
  const loadInventories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await inventoryService.getAllInventory();

      setInventories(response.data || []);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to load inventory.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventories();
  }, []);

  // Stage 2: Search inventory
  const filteredInventories = inventories.filter((inventory) => {
    const keyword = searchKeyword.toLowerCase().trim();

    if (keyword === "") {
      return true;
    }

    const productName = inventory.product?.name?.toLowerCase() || "";
    const sku = inventory.product?.sku?.toLowerCase() || "";
    const category = inventory.product?.category?.name?.toLowerCase() || "";
    const supplier = inventory.product?.supplier?.name?.toLowerCase() || "";
    const status = getStockStatus(inventory).toLowerCase();

    return (
      productName.includes(keyword) ||
      sku.includes(keyword) ||
      category.includes(keyword) ||
      supplier.includes(keyword) ||
      status.includes(keyword)
    );
  });

  const openStockForm = (inventory, actionType) => {
    setSelectedInventory(inventory);
    setStockActionType(actionType);
    setStockQuantity("");
    setFormError("");
    setSuccessMessage("");
  };

  const closeStockForm = () => {
    setSelectedInventory(null);
    setStockActionType("");
    setStockQuantity("");
    setFormError("");
  };

  // Stage 3: Add / Reduce stock
  const handleStockSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (stockQuantity === "") {
      setFormError("Quantity is required.");
      return;
    }

    if (Number(stockQuantity) <= 0) {
      setFormError("Quantity must be greater than 0.");
      return;
    }

    if (!selectedInventory?.id) {
      setFormError("Inventory record is missing.");
      return;
    }

    try {
      setSaving(true);

      const stockData = {
        quantity: Number(stockQuantity),
      };

      if (stockActionType === "ADD") {
        await inventoryService.addStock(selectedInventory.id, stockData);
        setSuccessMessage("Stock added successfully.");
      }

      if (stockActionType === "REDUCE") {
        await inventoryService.reduceStock(selectedInventory.id, stockData);
        setSuccessMessage("Stock reduced successfully.");
      }

      closeStockForm();
      await loadInventories();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        Object.values(error.response?.data || {})[0] ||
        "Unable to update stock.";

      setFormError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="mb-0 text-muted">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <div className="d-flex justify-content-between align-items-center">
          <span>{error}</span>

          <button
            className="btn btn-sm btn-outline-danger"
            onClick={loadInventories}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!canManageInventory && (
        <div className="alert alert-info" role="alert">
          You are logged in as STAFF. You can view inventory, but only ADMIN can
          add or reduce stock.
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {formError && !selectedInventory && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      {/* Stage 4: Search UI */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-8">
              <label className="form-label">Search Inventory</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by product, SKU, category, supplier, or status"
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
            Showing {filteredInventories.length} of {inventories.length} inventory records
          </div>
        </div>
      </div>

      {/* Stage 5: Stock action form */}
      {canManageInventory && selectedInventory && (
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h6 className="mb-3">
              {stockActionType === "ADD" ? "Add Stock" : "Reduce Stock"}
            </h6>

            <div className="mb-3">
              <strong>{selectedInventory.product?.name}</strong>
              <div className="small text-muted">
                SKU: {selectedInventory.product?.sku}
              </div>
              <div className="small text-muted">
                Current Quantity: {selectedInventory.quantity}
              </div>
            </div>

            {formError && (
              <div className="alert alert-danger" role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleStockSubmit}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter quantity"
                    value={stockQuantity}
                    onChange={(event) => setStockQuantity(event.target.value)}
                    disabled={saving}
                    min="1"
                  />
                </div>

                <div className="col-md-4 d-flex align-items-end gap-2">
                  <button
                    type="submit"
                    className={
                      stockActionType === "ADD"
                        ? "btn btn-success w-100"
                        : "btn btn-warning w-100"
                    }
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={closeStockForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stage 6: Optimized inventory table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {filteredInventories.length === 0 ? (
            <div className="text-center py-5">
              <div className="fs-1 text-muted">
                <i className="bi bi-box-seam"></i>
              </div>

              <h6 className="mt-3">
                {inventories.length === 0
                  ? "No inventory records found"
                  : "No matching inventory records found"}
              </h6>

              <p className="text-muted mb-0">
                {inventories.length === 0
                  ? "Create products first to generate inventory records."
                  : "Try searching with another keyword."}
              </p>
            </div>
          ) : (
            <table className="table align-middle inventory-table">
              <thead>
                <tr>
                  <th className="inventory-product-col">Product</th>
                  <th className="inventory-source-col">Category / Supplier</th>
                  <th className="inventory-price-col">Price</th>
                  <th className="inventory-stock-col">Stock</th>
                  <th className="inventory-status-col">Status</th>

                  {canManageInventory && (
                    <th className="inventory-actions-col">Actions</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredInventories.map((inventory) => {
                  const status = getStockStatus(inventory);
                  const quantity = Number(inventory.quantity ?? 0);

                  return (
                    <tr key={inventory.id}>
                      <td>
                        <strong>{inventory.product?.name || "No product"}</strong>

                        <div className="small text-muted">
                          SKU: {inventory.product?.sku || "-"}
                        </div>

                        {inventory.product?.description && (
                          <div className="small text-muted">
                            {inventory.product.description}
                          </div>
                        )}
                      </td>

                      <td>
                        <div>
                          <strong>{inventory.product?.category?.name || "No category"}</strong>
                        </div>

                        <div className="small text-muted">
                          Supplier: {inventory.product?.supplier?.name || "No supplier"}
                        </div>
                      </td>

                      <td>{formatPrice(inventory.product?.price)}</td>

                      <td>
                        <div>
                          <strong>Qty: {inventory.quantity}</strong>
                        </div>

                        <div className="small text-muted">
                          Min: {inventory.product?.minimumStock ?? 0}
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${getStockStatusBadge(status)}`}>
                          {status}
                        </span>
                      </td>

                      {canManageInventory && (
                        <td>
                          <div className="inventory-actions">
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => openStockForm(inventory, "ADD")}
                              disabled={saving}
                            >
                              <i className="bi bi-plus-circle me-1"></i>
                              Add
                            </button>

                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => openStockForm(inventory, "REDUCE")}
                              disabled={saving || quantity === 0}
                            >
                              <i className="bi bi-dash-circle me-1"></i>
                              Reduce
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryPage;