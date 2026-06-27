import { useEffect, useState } from "react";
import categoryService from "../../services/categoryService";
import { isAdmin } from "../../utils/authUtil";

function CategoryPage() {
  const canManageCategories = isAdmin();

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await categoryService.getAllCategories();

      setCategories(response.data || []);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to load categories.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
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
      description: "",
    });

    setFormError("");
  };

  const resetEditForm = () => {
    setEditFormData({
      name: "",
      description: "",
    });

    setEditingCategoryId(null);
    setFormError("");
  };

  const handleCancelAdd = () => {
    resetAddForm();
    setShowAddForm(false);
  };

  const handleCreateCategory = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (formData.name.trim() === "") {
      setFormError("Category name is required.");
      return;
    }

    try {
      setSaving(true);

      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      await categoryService.createCategory(categoryData);

      setSuccessMessage("Category created successfully.");
      resetAddForm();
      setShowAddForm(false);
      await loadCategories();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to create category.";

      setFormError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (category) => {
    setShowAddForm(false);
    setSuccessMessage("");
    setFormError("");

    setEditingCategoryId(category.id);
    setEditFormData({
      name: category.name || "",
      description: category.description || "",
    });
  };

  const handleUpdateCategory = async (categoryId) => {
    setFormError("");
    setSuccessMessage("");

    if (editFormData.name.trim() === "") {
      setFormError("Category name is required.");
      return;
    }

    try {
      setUpdating(true);

      const categoryData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
      };

      await categoryService.updateCategory(categoryId, categoryData);

      setSuccessMessage("Category updated successfully.");
      resetEditForm();
      await loadCategories();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to update category.";

      setFormError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    setFormError("");
    setSuccessMessage("");

    const confirmed = window.confirm(
      `Are you sure you want to delete category "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingCategoryId(category.id);

      await categoryService.deleteCategory(category.id);

      setSuccessMessage("Category deleted successfully.");
      await loadCategories();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Unable to delete category. This category may be used by products.";

      setFormError(errorMessage);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="mb-0 text-muted">Loading categories...</p>
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
            onClick={loadCategories}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!canManageCategories && (
        <div className="alert alert-info" role="alert">
          You are logged in as STAFF. You can view categories, but only ADMIN can
          add, edit, or delete categories.
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

      {canManageCategories && (
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
            Add Category
          </button>
        </div>
      )}

      {canManageCategories && showAddForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h6 className="mb-3">Add New Category</h6>

            {formError && (
              <div className="alert alert-danger" role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCategory}>
              <div className="row g-3">
                <div className="col-md-5">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Example: Mobile"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={saving}
                  />
                </div>

                <div className="col-md-7">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    name="description"
                    className="form-control"
                    placeholder="Example: Mobile phones and accessories"
                    value={formData.description}
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
                  {saving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {categories.length === 0 ? (
            <div className="text-center py-5">
              <div className="fs-1 text-muted">
                <i className="bi bi-folder"></i>
              </div>
              <h6 className="mt-3">No categories found</h6>
              <p className="text-muted mb-0">
                Create your first category to organize products.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    {canManageCategories && (
                      <th style={{ width: "240px" }}>Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => {
                    const isEditing = editingCategoryId === category.id;
                    const isDeleting = deletingCategoryId === category.id;

                    return (
                      <tr key={category.id}>
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
                            <strong>{category.name}</strong>
                          )}
                        </td>

                        <td className={isEditing ? "" : "text-muted"}>
                          {isEditing ? (
                            <input
                              type="text"
                              name="description"
                              className="form-control form-control-sm"
                              value={editFormData.description}
                              onChange={handleEditInputChange}
                              disabled={updating}
                            />
                          ) : (
                            category.description || "No description"
                          )}
                        </td>

                        {canManageCategories && (
                          <td>
                            {isEditing ? (
                              <div className="table-action-area">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleUpdateCategory(category.id)}
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
                                  onClick={() => handleStartEdit(category)}
                                  disabled={isDeleting}
                                >
                                  <i className="bi bi-pencil me-1"></i>
                                  Edit
                                </button>

                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteCategory(category)}
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

export default CategoryPage;