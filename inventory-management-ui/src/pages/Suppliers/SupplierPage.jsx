import { useEffect, useState } from "react";
import supplierService from "../../services/supplierService";
import { isAdmin } from "../../utils/authUtil";

function SupplierPage() {
  const canManageSuppliers = isAdmin();

  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingSupplierId, setDeletingSupplierId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await supplierService.getAllSuppliers();

      setSuppliers(response.data || []);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to load suppliers.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;

    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const resetAddForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
    });

    setFormError("");
  };

  const resetEditForm = () => {
    setEditFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
    });

    setEditingSupplierId(null);
    setFormError("");
  };

  const handleCancelAdd = () => {
    resetAddForm();
    setShowAddForm(false);
  };

  const validateSupplierData = (supplierData) => {
    if (supplierData.name.trim() === "") {
      return "Supplier name is required.";
    }

    if (supplierData.email.trim() === "") {
      return "Supplier email is required.";
    }

    if (supplierData.phone.trim() === "") {
      return "Supplier phone is required.";
    }

    if (supplierData.address.trim() === "") {
      return "Supplier address is required.";
    }

    return "";
  };

  const handleCreateSupplier = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const validationMessage = validateSupplierData(formData);

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setSaving(true);

      const supplierData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      };

      await supplierService.createSupplier(supplierData);

      setSuccessMessage("Supplier created successfully.");
      resetAddForm();
      setShowAddForm(false);
      await loadSuppliers();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to create supplier.";

      setFormError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (supplier) => {
    setShowAddForm(false);
    setSuccessMessage("");
    setFormError("");

    setEditingSupplierId(supplier.id);
    setEditFormData({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
  };

  const handleUpdateSupplier = async (supplierId) => {
    setFormError("");
    setSuccessMessage("");

    const validationMessage = validateSupplierData(editFormData);

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setUpdating(true);

      const supplierData = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        address: editFormData.address.trim(),
      };

      await supplierService.updateSupplier(supplierId, supplierData);

      setSuccessMessage("Supplier updated successfully.");
      resetEditForm();
      await loadSuppliers();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to update supplier.";

      setFormError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    setFormError("");
    setSuccessMessage("");

    const confirmed = window.confirm(
      `Are you sure you want to delete supplier "${supplier.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSupplierId(supplier.id);

      await supplierService.deleteSupplier(supplier.id);

      setSuccessMessage("Supplier deleted successfully.");
      await loadSuppliers();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Unable to delete supplier. This supplier may be used by products.";

      setFormError(errorMessage);
    } finally {
      setDeletingSupplierId(null);
    }
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="mb-0 text-muted">Loading suppliers...</p>
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
            onClick={loadSuppliers}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!canManageSuppliers && (
        <div className="alert alert-info" role="alert">
          You are logged in as STAFF. You can view suppliers, but only ADMIN can
          add, edit, or delete suppliers.
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {formError && !showAddForm && (
        <div className="alert alert-danger" role="alert">
          {formError}
        </div>
      )}

      {canManageSuppliers && (
        <div className="d-flex justify-content-end mb-3">
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowAddForm(true);
              resetEditForm();
              setSuccessMessage("");
              setFormError("");
            }}
            disabled={showAddForm}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Add Supplier
          </button>
        </div>
      )}

      {canManageSuppliers && showAddForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h6 className="mb-3">Add New Supplier</h6>

            {formError && (
              <div className="alert alert-danger" role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSupplier}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Supplier Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Example: Samsung Distributor"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Example: samsung@biz.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    placeholder="Example: 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    name="address"
                    className="form-control"
                    placeholder="Example: Chennai"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>
              </div>

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
                  {saving ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {suppliers.length === 0 ? (
            <div className="text-center py-5">
              <div className="fs-1 text-muted">
                <i className="bi bi-truck"></i>
              </div>
              <h6 className="mt-3">No suppliers found</h6>
              <p className="text-muted mb-0">
                Create your first supplier to manage product sourcing.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    {canManageSuppliers && (
                      <th style={{ width: "240px" }}>Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {suppliers.map((supplier) => {
                    const isEditing = editingSupplierId === supplier.id;
                    const isDeleting = deletingSupplierId === supplier.id;

                    return (
                      <tr key={supplier.id}>
                        <td>{supplier.id}</td>

                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              name="name"
                              className="form-control form-control-sm"
                              value={editFormData.name}
                              onChange={handleEditInputChange}
                              disabled={updating}
                            />
                          ) : (
                            <strong>{supplier.name}</strong>
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <input
                              type="email"
                              name="email"
                              className="form-control form-control-sm"
                              value={editFormData.email}
                              onChange={handleEditInputChange}
                              disabled={updating}
                            />
                          ) : (
                            <span className="text-muted">
                              {supplier.email || "No email"}
                            </span>
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              name="phone"
                              className="form-control form-control-sm"
                              value={editFormData.phone}
                              onChange={handleEditInputChange}
                              disabled={updating}
                            />
                          ) : (
                            supplier.phone || "No phone"
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              name="address"
                              className="form-control form-control-sm"
                              value={editFormData.address}
                              onChange={handleEditInputChange}
                              disabled={updating}
                            />
                          ) : (
                            <span className="text-muted">
                              {supplier.address || "No address"}
                            </span>
                          )}
                        </td>

                        {canManageSuppliers && (
                          <td>
                            {isEditing ? (
                              <div className="table-action-area">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleUpdateSupplier(supplier.id)}
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
                                  onClick={() => handleStartEdit(supplier)}
                                  disabled={isDeleting}
                                >
                                  <i className="bi bi-pencil me-1"></i>
                                  Edit
                                </button>

                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteSupplier(supplier)}
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

export default SupplierPage;