import { useEffect, useState } from "react";
import productService from "../../services/productService";
import salesService from "../../services/salesService";
import categoryService from "../../services/categoryService";
import inventoryService from "../../services/inventoryService";

function SalesPage() {
  const [quickPickMode, setQuickPickMode] = useState("CATEGORIES");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [categories, setCategories] = useState([]);
  const [inventoryProducts, setInventoryProducts] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selling, setSelling] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [invoice, setInvoice] = useState(null);

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "₹0.00";
    }

    return `₹${Number(price).toFixed(2)}`;
  };

  const getProductPrice = (product) => {
    return Number(product.price ?? product.sellingPrice ?? 0);
  };

  const sortByName = (items) => {
    return [...items].sort((first, second) =>
      (first.name || "").localeCompare(second.name || "")
    );
  };

  const getInvoiceItems = () => {
    return invoice?.items || invoice?.saleItems || invoice?.invoiceItems || [];
  };

  const getInvoiceTotal = () => {
    return invoice?.totalAmount ?? invoice?.grandTotal ?? invoice?.amount ?? 0;
  };

  const getInvoiceNumber = () => {
    return (
      invoice?.invoiceNumber ||
      invoice?.invoiceNo ||
      `INV-${invoice?.invoiceId || invoice?.id || ""}`
    );
  };

  const getAvailableStock = (productId) => {
    const inventoryProduct = inventoryProducts.find(
      (product) => product.id === productId
    );

    return inventoryProduct?.quantity;
  };

  const getCartQuantity = (productId) => {
    const cartItem = cartItems.find((item) => item.productId === productId);
    return cartItem?.quantity || 0;
  };

  const canAddProduct = (product) => {
    const availableStock = product.quantity ?? getAvailableStock(product.id);

    if (availableStock === undefined || availableStock === null) {
      return true;
    }

    return Number(availableStock) > getCartQuantity(product.id);
  };

  // Stage 1: Load quick pick categories and products
  const loadQuickPickData = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoryResponse, inventoryResponse] = await Promise.all([
        categoryService.getAllCategories(),
        inventoryService.getAllInventory(),
      ]);

      const sortedCategories = sortByName(categoryResponse.data || []);

      const productsWithStock = (inventoryResponse.data || [])
        .filter((inventory) => inventory.product)
        .map((inventory) => ({
          ...inventory.product,
          inventoryId: inventory.id,
          quantity: Number(inventory.quantity ?? 0),
        }));

      setCategories(sortedCategories);
      setInventoryProducts(sortByName(productsWithStock));
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to load billing products.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuickPickData();
  }, []);

  // Stage 2: Product search
  const handleSearchProduct = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setInvoice(null);

    if (searchKeyword.trim() === "") {
      setError("Enter product name or SKU to search.");
      return;
    }

    try {
      setSearching(true);

      const response = await productService.searchProducts(searchKeyword.trim());

      const searchProducts = (response.data || []).map((product) => {
        const inventoryProduct = inventoryProducts.find(
          (item) => item.id === product.id
        );

        return {
          ...product,
          quantity: inventoryProduct?.quantity,
        };
      });

      const sortedSearchProducts = sortByName(searchProducts);

      setSearchResults(sortedSearchProducts);

      if (sortedSearchProducts.length === 0) {
        setError("No products found for this keyword.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to search products.";

      setError(errorMessage);
    } finally {
      setSearching(false);
    }
  };

  // Stage 2.1: Auto search product suggestions
useEffect(() => {
  if (quickPickMode !== "SEARCH") {
    return;
  }

  const keyword = searchKeyword.trim();

  if (keyword === "") {
    setSearchResults([]);
    return;
  }

  const timerId = setTimeout(async () => {
    try {
      setSearching(true);
      setError("");

      const response = await productService.searchProducts(keyword);

      const searchProducts = (response.data || []).map((product) => {
        const inventoryProduct = inventoryProducts.find(
          (item) => item.id === product.id
        );

        return {
          ...product,
          quantity: inventoryProduct?.quantity,
        };
      });

      const sortedSearchProducts = [...searchProducts].sort((first, second) =>
        (first.name || "").localeCompare(second.name || "")
      );

      setSearchResults(sortedSearchProducts);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to search products.";

      setError(errorMessage);
    } finally {
      setSearching(false);
    }
  }, 300);

  return () => clearTimeout(timerId);
}, [searchKeyword, quickPickMode, inventoryProducts]);

  const showCategoriesMode = () => {
    setQuickPickMode("CATEGORIES");
    setError("");
    setSuccessMessage("");
    setInvoice(null);
  };

  const showProductsMode = () => {
    setQuickPickMode("PRODUCTS");
    setSelectedCategoryId("");
    setError("");
    setSuccessMessage("");
    setInvoice(null);
  };

  const showSearchMode = () => {
    setQuickPickMode("SEARCH");
    setError("");
    setSuccessMessage("");
    setInvoice(null);
  };

  const getDisplayedProducts = () => {
    if (quickPickMode === "SEARCH") {
      return searchResults;
    }

    if (quickPickMode === "PRODUCTS") {
      return inventoryProducts;
    }

    if (selectedCategoryId === "") {
      return inventoryProducts;
    }

    return inventoryProducts.filter(
      (product) => String(product.category?.id) === String(selectedCategoryId)
    );
  };

  // Stage 3: Cart management
  const handleAddToCart = (product) => {
    setError("");
    setSuccessMessage("");
    setInvoice(null);

    if (!canAddProduct(product)) {
      setError("Selected quantity is greater than available stock.");
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.productId === product.id
      );

      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentItems,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: getProductPrice(product),
          quantity: 1,
        },
      ];
    });
  };

  const handleIncreaseQuantity = (productId) => {
    const availableStock = getAvailableStock(productId);
    const currentQuantity = getCartQuantity(productId);

    if (
      availableStock !== undefined &&
      availableStock !== null &&
      currentQuantity >= Number(availableStock)
    ) {
      setError("Selected quantity is greater than available stock.");
      return;
    }

    setError("");

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecreaseQuantity = (productId) => {
    setError("");

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId) => {
    setError("");

    setCartItems((currentItems) =>
      currentItems.filter((item) => item.productId !== productId)
    );
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  };

  const clearSale = () => {
    setSearchKeyword("");
    setSearchResults([]);
    setCartItems([]);
    setCustomerName("Walk-in Customer");
    setSelectedCategoryId("");
    setQuickPickMode("CATEGORIES");
    setError("");
    setSuccessMessage("");
    setInvoice(null);
  };

  // Stage 4: Complete sale
  const handleCompleteSale = async () => {
    setError("");
    setSuccessMessage("");
    setInvoice(null);

    if (cartItems.length === 0) {
      setError("Add at least one product to cart.");
      return;
    }

    try {
      setSelling(true);

      const saleData = {
        customerName: customerName.trim() || "Walk-in Customer",
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const response = await salesService.createSale(saleData);

      setInvoice(response.data);
      setCartItems([]);
      setSearchResults([]);
      setSearchKeyword("");
      setSelectedCategoryId("");
      setQuickPickMode("CATEGORIES");
      setSuccessMessage("Sale completed successfully.");

      await loadQuickPickData();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        Object.values(error.response?.data || {})[0] ||
        "Unable to complete sale.";

      setError(errorMessage);
    } finally {
      setSelling(false);
    }
  };

  const displayedProducts = getDisplayedProducts();

  const renderProductCard = (product) => {
    const availableStock = product.quantity ?? getAvailableStock(product.id);
    const outOfStock = Number(availableStock ?? 1) <= 0;
    const addDisabled = selling || outOfStock || !canAddProduct(product);

    return (
      <div className="sales-product-card" key={product.id}>
        <div className="sales-product-info">
          <strong>{product.name}</strong>

          <div className="small text-muted">SKU: {product.sku || "-"}</div>

          <div className="small text-muted">
            Category: {product.category?.name || "No category"}
          </div>

          <div className="small text-muted">
            Supplier: {product.supplier?.name || "No supplier"}
          </div>
        </div>

        <div className="sales-product-action">
          <div className="fw-semibold">{formatPrice(getProductPrice(product))}</div>

          <span
            className={
              outOfStock
                ? "badge text-bg-danger"
                : Number(availableStock ?? 0) <= Number(product.minimumStock ?? 0)
                ? "badge text-bg-warning"
                : "badge text-bg-success"
            }
          >
            Stock: {availableStock ?? "-"}
          </span>

          <button
            className="btn btn-sm btn-success"
            onClick={() => handleAddToCart(product)}
            disabled={addDisabled}
          >
            <i className="bi bi-cart-plus me-1"></i>
            Add
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="mb-0 text-muted">Loading billing products...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      <div className="sales-billing-layout">
        <div className="card border-0 shadow-sm sales-panel">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h5 className="mb-1">Quick Pick Billing</h5>
                <p className="text-muted mb-0">
                  Pick products by category, product list, or search.
                </p>
              </div>

              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={clearSale}
                disabled={selling}
              >
                Clear
              </button>
            </div>

            {/* Stage 5: Quick pick mode buttons */}
            <div className="sales-mode-buttons mb-3">
              <button
                className={
                  quickPickMode === "CATEGORIES"
                    ? "btn btn-primary btn-sm"
                    : "btn btn-outline-primary btn-sm"
                }
                onClick={showCategoriesMode}
                disabled={selling}
              >
                <i className="bi bi-grid me-1"></i>
                Categories
              </button>

              <button
                className={
                  quickPickMode === "PRODUCTS"
                    ? "btn btn-primary btn-sm"
                    : "btn btn-outline-primary btn-sm"
                }
                onClick={showProductsMode}
                disabled={selling}
              >
                <i className="bi bi-box-seam me-1"></i>
                Products
              </button>

              <button
                className={
                  quickPickMode === "SEARCH"
                    ? "btn btn-primary btn-sm"
                    : "btn btn-outline-primary btn-sm"
                }
                onClick={showSearchMode}
                disabled={selling}
              >
                <i className="bi bi-search me-1"></i>
                Search
              </button>
            </div>

            {/* Stage 6: Category and search controls */}
            {quickPickMode === "CATEGORIES" && (
              <div className="sales-category-area mb-3">
                <button
                  className={
                    selectedCategoryId === ""
                      ? "btn btn-dark btn-sm"
                      : "btn btn-outline-dark btn-sm"
                  }
                  onClick={() => setSelectedCategoryId("")}
                  disabled={selling}
                >
                  All
                </button>

                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={
                      String(selectedCategoryId) === String(category.id)
                        ? "btn btn-dark btn-sm"
                        : "btn btn-outline-dark btn-sm"
                    }
                    onClick={() => setSelectedCategoryId(category.id)}
                    disabled={selling}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}

            {quickPickMode === "SEARCH" && (
              <form onSubmit={handleSearchProduct} className="mb-3">
                <div className="row g-2">
                  <div className="col-md-8">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Start typing product name or SKU"
                      value={searchKeyword}
                      onChange={(event) => setSearchKeyword(event.target.value)}
                      disabled={selling}
                    />
                  </div>

                  <div className="col-md-4">
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={searching || selling}
                    >
                      {searching ? "Searching..." : "Search"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Stage 7: Product quick pick list */}
            <div className="sales-products-header">
              <div>
                <strong>
                  {quickPickMode === "SEARCH"
                    ? "Search Results"
                    : quickPickMode === "PRODUCTS"
                    ? "All Products"
                    : "Category Products"}
                </strong>
                <div className="small text-muted">
                  Showing {displayedProducts.length} products in alphabetical order
                </div>
              </div>
            </div>

            <div className="sales-results-area mt-3">
              {displayedProducts.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-box-seam fs-1"></i>
                  <p className="mt-2 mb-0">
                    {quickPickMode === "SEARCH"
                      ? "Search products to start billing."
                      : "No products found."}
                  </p>
                </div>
              ) : (
                <div className="sales-product-grid">
                  {displayedProducts.map((product) => renderProductCard(product))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stage 8: Cart and invoice summary */}
        <div className="card border-0 shadow-sm sales-cart-panel">
          <div className="card-body">
            <h5 className="mb-3">Cart Summary</h5>

            <div className="mb-3">
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                className="form-control"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                disabled={selling}
              />
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-4 text-muted border rounded">
                <i className="bi bi-cart fs-1"></i>
                <p className="mt-2 mb-0">Cart is empty.</p>
              </div>
            ) : (
              <div className="sales-cart-items">
                {cartItems.map((item) => (
                  <div className="sales-cart-item" key={item.productId}>
                    <div>
                      <strong>{item.name}</strong>
                      <div className="small text-muted">SKU: {item.sku}</div>
                      <div className="small text-muted">
                        {formatPrice(item.price)} × {item.quantity}
                      </div>
                    </div>

                    <div className="sales-cart-controls">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleDecreaseQuantity(item.productId)}
                        disabled={selling || item.quantity === 1}
                      >
                        -
                      </button>

                      <span className="sales-cart-qty">{item.quantity}</span>

                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleIncreaseQuantity(item.productId)}
                        disabled={selling}
                      >
                        +
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveFromCart(item.productId)}
                        disabled={selling}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>

                    <div className="fw-semibold text-end">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="sales-total-box mt-3">
              <span>Total</span>
              <strong>{formatPrice(calculateCartTotal())}</strong>
            </div>

            <button
              className="btn btn-primary w-100 mt-3"
              onClick={handleCompleteSale}
              disabled={selling || cartItems.length === 0}
            >
              {selling ? "Completing Sale..." : "Complete Sale"}
            </button>
          </div>
        </div>
      </div>

      {/* Stage 9: Invoice response */}
      {invoice && (
        <div className="card border-0 shadow-sm mt-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 className="mb-1">Invoice Created</h5>
                <p className="text-muted mb-0">
                  Invoice Number: <strong>{getInvoiceNumber()}</strong>
                </p>
              </div>

              <span className="badge text-bg-success">Paid</span>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <div className="small text-muted">Customer</div>
                <strong>
                  {invoice.customerName || customerName || "Walk-in Customer"}
                </strong>
              </div>

              <div className="col-md-4">
                <div className="small text-muted">Invoice ID</div>
                <strong>{invoice.invoiceId || invoice.id || "-"}</strong>
              </div>

              <div className="col-md-4">
                <div className="small text-muted">Total Amount</div>
                <strong>{formatPrice(getInvoiceTotal())}</strong>
              </div>
            </div>

            {getInvoiceItems().length > 0 && (
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th className="text-end">Line Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {getInvoiceItems().map((item, index) => (
                      <tr key={index}>
                        <td>
                          {item.productName || item.name || item.product?.name || "-"}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{formatPrice(item.unitPrice ?? item.price)}</td>
                        <td className="text-end">
                          {formatPrice(item.lineTotal ?? item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesPage;