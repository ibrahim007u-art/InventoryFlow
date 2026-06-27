import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dashboardService from "../../services/dashboardService";
import inventoryService from "../../services/inventoryService";
import salesService from "../../services/salesService";
import stockMovementService from "../../services/stockMovementService";
import { getUser, isAdmin } from "../../utils/authUtil";

function DashboardPage() {
  const currentDate = new Date();
  const user = getUser();
  const adminUser = isAdmin();

  const [dashboard, setDashboard] = useState({});
  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [inventoryValueItems, setInventoryValueItems] = useState([]);
  const [inventoryValueTotal, setInventoryValueTotal] = useState(0);
  const [sales, setSales] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  const [periodFilter, setPeriodFilter] = useState("TODAY");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.reportItems)) return data.reportItems;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.inventories)) return data.inventories;

    return [];
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "₹0.00";
    }

    return `₹${Number(price).toFixed(2)}`;
  };

  const formatDateTime = (dateValue) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDashboardValue = (...keys) => {
    for (const key of keys) {
      if (dashboard?.[key] !== undefined && dashboard?.[key] !== null) {
        return Number(dashboard[key]);
      }
    }

    return 0;
  };

  const getProduct = (item) => {
    return (
      item?.product || {
        id: item?.productId,
        name: item?.productName || item?.name,
        sku: item?.sku,
        price: item?.price || item?.sellingPrice,
        minimumStock: item?.minimumStock,
        category: item?.category,
        supplier: item?.supplier,
      }
    );
  };

  const getProductName = (item) => {
    const product = getProduct(item);

    return product?.name || item?.productName || item?.name || "Unknown Product";
  };

  const getProductSku = (item) => {
    const product = getProduct(item);

    return product?.sku || item?.sku || "-";
  };

  const getProductCategory = (item) => {
    const product = getProduct(item);

    return product?.category?.name || product?.categoryName || item?.categoryName || "-";
  };

  const getProductSupplier = (item) => {
    const product = getProduct(item);

    return product?.supplier?.name || product?.supplierName || item?.supplierName || "-";
  };

  const getProductPrice = (item) => {
    const product = getProduct(item);

    return Number(
      item?.price ??
        item?.sellingPrice ??
        product?.price ??
        product?.sellingPrice ??
        0
    );
  };

  const getInventoryQuantity = (item) => {
    return Number(
      item?.quantity ??
        item?.currentQuantity ??
        item?.stockQuantity ??
        item?.availableStock ??
        0
    );
  };

  const getMinimumStock = (item) => {
    const product = getProduct(item);

    return Number(item?.minimumStock ?? product?.minimumStock ?? 0);
  };

  const getInventoryItemValue = (item) => {
    return Number(
      item?.totalValue ??
        item?.inventoryValue ??
        item?.stockValue ??
        item?.value ??
        getProductPrice(item) * getInventoryQuantity(item)
    );
  };

  const getInventoryValueTotalFromResponse = (data, items) => {
    const directTotal = Number(
      data?.totalInventoryValue ??
        data?.inventoryValue ??
        data?.totalValue ??
        data?.grandTotal ??
        data?.value ??
        0
    );

    if (directTotal > 0) {
      return directTotal;
    }

    return items.reduce((total, item) => total + getInventoryItemValue(item), 0);
  };

  const getInvoiceId = (invoice) => {
    return invoice?.invoiceId ?? invoice?.id ?? invoice?.saleId;
  };

  const getInvoiceNumber = (invoice) => {
    const invoiceId = getInvoiceId(invoice);

    return invoice?.invoiceNumber || invoice?.invoiceNo || `INV-${invoiceId || ""}`;
  };

  const getInvoiceDate = (invoice) => {
    return invoice?.createdAt || invoice?.invoiceDate || invoice?.saleDate || invoice?.date;
  };

  const getInvoiceTotal = (invoice) => {
    return Number(invoice?.totalAmount ?? invoice?.grandTotal ?? invoice?.amount ?? 0);
  };

  const getCustomerName = (invoice) => {
    return invoice?.customerName || invoice?.customer || "Walk-in Customer";
  };

  const getInvoiceItems = (invoice) => {
    return invoice?.items || invoice?.saleItems || invoice?.invoiceItems || [];
  };

  const getMovementId = (movement) => {
    return movement?.id ?? movement?.movementId ?? movement?.stockMovementId;
  };

  const getMovementProduct = (movement) => {
    return (
      movement?.product || {
        id: movement?.productId,
        name: movement?.productName,
        sku: movement?.sku,
      }
    );
  };

  const getMovementProductName = (movement) => {
    const product = getMovementProduct(movement);

    return product?.name || movement?.productName || "Unknown Product";
  };

  const getMovementProductSku = (movement) => {
    const product = getMovementProduct(movement);

    return product?.sku || movement?.sku || "-";
  };

  const getMovementDate = (movement) => {
    return movement?.movementDate || movement?.createdAt || movement?.updatedAt || movement?.date;
  };

  const getMovementTypeRaw = (movement) => {
    return String(
      movement?.movementType ||
        movement?.type ||
        movement?.stockMovementType ||
        ""
    ).toUpperCase();
  };

  const getMovementQuantity = (movement) => {
    return Number(
      movement?.quantityChange ??
        movement?.quantity ??
        movement?.changeQuantity ??
        movement?.stockChange ??
        0
    );
  };

  const getMovementType = (movement) => {
    const rawType = getMovementTypeRaw(movement);
    const quantity = getMovementQuantity(movement);

    if (rawType.includes("ADD") || rawType.includes("IN")) return "IN";
    if (rawType.includes("REMOVE") || rawType.includes("OUT") || rawType.includes("SALE")) return "OUT";
    if (quantity > 0) return "IN";
    if (quantity < 0) return "OUT";

    return rawType || "UNKNOWN";
  };

  const getMovementNote = (movement) => {
    return movement?.note || movement?.reason || movement?.description || movement?.remarks || "-";
  };

  const getMovementBadgeClass = (movement) => {
    const type = getMovementType(movement);

    if (type === "IN") return "badge text-bg-success";
    if (type === "OUT") return "badge text-bg-danger";

    return "badge text-bg-dark";
  };

  const isToday = (dateValue) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return (
      date.getFullYear() === currentDate.getFullYear() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getDate() === currentDate.getDate()
    );
  };

  const isThisMonth = (dateValue) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return (
      date.getFullYear() === currentDate.getFullYear() &&
      date.getMonth() === currentDate.getMonth()
    );
  };

  const filterByPeriod = (dateValue) => {
    if (periodFilter === "ALL") {
      return true;
    }

    if (periodFilter === "TODAY") {
      return isToday(dateValue);
    }

    if (periodFilter === "MONTH") {
      return isThisMonth(dateValue);
    }

    return true;
  };

  // Stage 1: Load dashboard data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      setWarning("");

      const [
        dashboardResult,
        lowStockResult,
        outOfStockResult,
        inventoryValueResult,
        salesResult,
        movementResult,
      ] = await Promise.allSettled([
        dashboardService.getDashboardSummary(),
        inventoryService.getLowStockReport(),
        inventoryService.getOutOfStockReport(),
        inventoryService.getInventoryValueReport(),
        salesService.getAllSales(),
        stockMovementService.getAllStockMovements(),
      ]);

      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value.data || {});
      }

      if (lowStockResult.status === "fulfilled") {
        setLowStockItems(normalizeList(lowStockResult.value.data));
      }

      if (outOfStockResult.status === "fulfilled") {
        setOutOfStockItems(normalizeList(outOfStockResult.value.data));
      }

      if (inventoryValueResult.status === "fulfilled") {
        const items = normalizeList(inventoryValueResult.value.data);
        setInventoryValueItems(items);
        setInventoryValueTotal(
          getInventoryValueTotalFromResponse(inventoryValueResult.value.data, items)
        );
      }

      if (salesResult.status === "fulfilled") {
        setSales(normalizeList(salesResult.value.data));
      }

      if (movementResult.status === "fulfilled") {
        setStockMovements(normalizeList(movementResult.value.data));
      }

      const failedCount = [
        dashboardResult,
        lowStockResult,
        outOfStockResult,
        inventoryValueResult,
        salesResult,
        movementResult,
      ].filter((result) => result.status === "rejected").length;

      if (failedCount === 6) {
        setError("Unable to load dashboard.");
      } else if (failedCount > 0) {
        setWarning("Some dashboard sections could not be loaded. Refresh after checking backend APIs.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to load dashboard.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((invoice) => filterByPeriod(getInvoiceDate(invoice)));
  }, [sales, periodFilter]);

  const filteredMovements = useMemo(() => {
    return stockMovements.filter((movement) => filterByPeriod(getMovementDate(movement)));
  }, [stockMovements, periodFilter]);

  // Stage 2: Calculate dashboard summaries
  const dashboardSummary = useMemo(() => {
    const salesAmount = filteredSales.reduce(
      (total, invoice) => total + getInvoiceTotal(invoice),
      0
    );

    let stockInQuantity = 0;
    let stockOutQuantity = 0;

    filteredMovements.forEach((movement) => {
      const type = getMovementType(movement);
      const quantity = Math.abs(getMovementQuantity(movement));

      if (type === "IN") {
        stockInQuantity += quantity;
      }

      if (type === "OUT") {
        stockOutQuantity += quantity;
      }
    });

    const inventoryValueFromItems = inventoryValueItems.reduce(
      (total, item) => total + getInventoryItemValue(item),
      0
    );

    return {
      totalProducts: getDashboardValue("totalProducts", "productCount", "productsCount"),
      totalCategories: getDashboardValue("totalCategories", "categoryCount", "categoriesCount"),
      totalSuppliers: getDashboardValue("totalSuppliers", "supplierCount", "suppliersCount"),
      totalInventories:
        getDashboardValue("totalInventories", "inventoryCount", "inventoriesCount") ||
        inventoryValueItems.length,
      inventoryValue:
        inventoryValueTotal > 0 ? inventoryValueTotal : inventoryValueFromItems,
      salesAmount,
      salesCount: filteredSales.length,
      averageBill: filteredSales.length === 0 ? 0 : salesAmount / filteredSales.length,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      stockMovementCount: filteredMovements.length,
      stockInQuantity,
      stockOutQuantity,
      netStockQuantity: stockInQuantity - stockOutQuantity,
    };
  }, [
    dashboard,
    inventoryValueItems,
    inventoryValueTotal,
    filteredSales,
    filteredMovements,
    lowStockItems,
    outOfStockItems,
  ]);

  const latestInvoice = useMemo(() => {
    return [...filteredSales].sort(
      (first, second) => new Date(getInvoiceDate(second)) - new Date(getInvoiceDate(first))
    )[0];
  }, [filteredSales]);

  const recentMovements = useMemo(() => {
    return [...stockMovements]
      .sort(
        (first, second) => new Date(getMovementDate(second)) - new Date(getMovementDate(first))
      )
      .slice(0, 5);
  }, [stockMovements]);

  const lowStockPreview = useMemo(() => {
    return lowStockItems.slice(0, 5);
  }, [lowStockItems]);

  const outOfStockPreview = useMemo(() => {
    return outOfStockItems.slice(0, 5);
  }, [outOfStockItems]);

  const getPeriodLabel = () => {
    if (periodFilter === "TODAY") return "Today";
    if (periodFilter === "MONTH") return "This Month";
    return "All Time";
  };

  const renderQuickActions = () => {
    const actions = adminUser
      ? [
          {
            label: "New Sale",
            path: "/sales",
            icon: "bi-cart-plus",
            text: "Create a bill",
          },
          {
            label: "Add Product",
            path: "/products",
            icon: "bi-box-seam",
            text: "Manage products",
          },
          {
            label: "Add Stock",
            path: "/inventory",
            icon: "bi-plus-circle",
            text: "Update inventory",
          },
          {
            label: "View Reports",
            path: "/reports",
            icon: "bi-bar-chart",
            text: "Business reports",
          },
        ]
      : [
          {
            label: "New Sale",
            path: "/sales",
            icon: "bi-cart-plus",
            text: "Create a bill",
          },
          {
            label: "View Products",
            path: "/products",
            icon: "bi-box-seam",
            text: "Check products",
          },
          {
            label: "View Inventory",
            path: "/inventory",
            icon: "bi-stack",
            text: "Check stock",
          },
          {
            label: "View Reports",
            path: "/reports",
            icon: "bi-bar-chart",
            text: "Read reports",
          },
        ];

    return (
      <div className="dashboard-actions-grid">
        {actions.map((action) => (
          <Link className="dashboard-action-card" to={action.path} key={action.label}>
            <i className={`bi ${action.icon}`}></i>

            <span>
              <strong>{action.label}</strong>
              <small>{action.text}</small>
            </span>
          </Link>
        ))}
      </div>
    );
  };

  const renderStockPreview = (items, type) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-4 text-muted">
          <i className="bi bi-check-circle fs-2"></i>
          <p className="mt-2 mb-0">No {type === "LOW" ? "low-stock" : "out-of-stock"} products.</p>
        </div>
      );
    }

    return (
      <div className="dashboard-preview-list">
        {items.map((item, index) => (
          <div className="dashboard-preview-item" key={`${getProductSku(item)}-${index}`}>
            <div>
              <strong>{getProductName(item)}</strong>
              <div className="small text-muted">SKU: {getProductSku(item)}</div>
              <div className="small text-muted">
                {getProductCategory(item)} • {getProductSupplier(item)}
              </div>
            </div>

            <div className="text-end">
              <span
                className={
                  type === "LOW"
                    ? "badge text-bg-warning"
                    : "badge text-bg-danger"
                }
              >
                {type === "LOW" ? "Low Stock" : "Out Of Stock"}
              </span>
              <div className="small mt-1">
                Qty {getInventoryQuantity(item)} / Min {getMinimumStock(item)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRecentMovements = () => {
    if (recentMovements.length === 0) {
      return (
        <div className="text-center py-4 text-muted">
          <i className="bi bi-clock-history fs-2"></i>
          <p className="mt-2 mb-0">No recent stock movements.</p>
        </div>
      );
    }

    return (
      <div className="dashboard-preview-list">
        {recentMovements.map((movement) => (
          <div className="dashboard-preview-item" key={getMovementId(movement)}>
            <div>
              <strong>{getMovementProductName(movement)}</strong>
              <div className="small text-muted">SKU: {getMovementProductSku(movement)}</div>
              <div className="small text-muted">{formatDateTime(getMovementDate(movement))}</div>
              <div className="small text-muted">Note: {getMovementNote(movement)}</div>
            </div>

            <div className="text-end">
              <span className={getMovementBadgeClass(movement)}>
                {getMovementType(movement)}
              </span>
              <div className="small mt-1">Qty {Math.abs(getMovementQuantity(movement))}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="mb-0 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <div className="d-flex justify-content-between align-items-center">
          <span>{error}</span>

          <button className="btn btn-sm btn-outline-danger" onClick={loadDashboard}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {warning && (
        <div className="alert alert-warning" role="alert">
          {warning}
        </div>
      )}

      {/* Stage 3: Welcome and quick period filter */}
      <div className="dashboard-hero-card mb-3">
        <div>
          <p className="text-muted mb-1">Welcome back</p>
          <h4 className="mb-1">{user?.name || "User"}</h4>
          <p className="mb-0">
            {adminUser
              ? "Full access: manage products, stock, sales, and reports."
              : "Staff access: view stock, create sales, and check reports."}
          </p>
        </div>

        <div className="dashboard-period-filter">
          {[
            { key: "TODAY", label: "Today" },
            { key: "MONTH", label: "This Month" },
            { key: "ALL", label: "All" },
          ].map((period) => (
            <button
              type="button"
              key={period.key}
              className={
                periodFilter === period.key
                  ? "btn btn-primary btn-sm"
                  : "btn btn-outline-primary btn-sm"
              }
              onClick={() => setPeriodFilter(period.key)}
            >
              {period.label}
            </button>
          ))}

          <button className="btn btn-outline-dark btn-sm" onClick={loadDashboard}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Stage 4: Main business summary cards */}
      <div className="dashboard-summary-grid mb-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="dashboard-summary-icon text-primary">
              <i className="bi bi-box-seam"></i>
            </div>
            <div className="text-muted small">Total Products</div>
            <h4 className="mb-0">{dashboardSummary.totalProducts}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="dashboard-summary-icon text-info">
              <i className="bi bi-tags"></i>
            </div>
            <div className="text-muted small">Categories</div>
            <h4 className="mb-0">{dashboardSummary.totalCategories}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="dashboard-summary-icon text-secondary">
              <i className="bi bi-truck"></i>
            </div>
            <div className="text-muted small">Suppliers</div>
            <h4 className="mb-0">{dashboardSummary.totalSuppliers}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="dashboard-summary-icon text-dark">
              <i className="bi bi-stack"></i>
            </div>
            <div className="text-muted small">Inventory Records</div>
            <h4 className="mb-0">{dashboardSummary.totalInventories}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="dashboard-summary-icon text-success">
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="text-muted small">Inventory Value</div>
            <h4 className="mb-0">{formatPrice(dashboardSummary.inventoryValue)}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="dashboard-summary-icon text-primary">
              <i className="bi bi-receipt"></i>
            </div>
            <div className="text-muted small">Sales Amount</div>
            <h4 className="mb-0">{formatPrice(dashboardSummary.salesAmount)}</h4>
            <div className="small text-muted">
              {dashboardSummary.salesCount} invoices • {getPeriodLabel()}
            </div>
          </div>
        </div>
      </div>

      {/* Stage 5: Stock alert cards */}
      <div className="dashboard-alert-grid mb-3">
        <div className="dashboard-alert-card dashboard-alert-warning">
          <div>
            <div className="text-muted small">Low Stock Items</div>
            <h4 className="mb-0">{dashboardSummary.lowStockCount}</h4>
          </div>
          <i className="bi bi-exclamation-triangle"></i>
        </div>

        <div className="dashboard-alert-card dashboard-alert-danger">
          <div>
            <div className="text-muted small">Out Of Stock Items</div>
            <h4 className="mb-0">{dashboardSummary.outOfStockCount}</h4>
          </div>
          <i className="bi bi-x-octagon"></i>
        </div>

        <div className="dashboard-alert-card dashboard-alert-success">
          <div>
            <div className="text-muted small">Stock IN Qty</div>
            <h4 className="mb-0">{dashboardSummary.stockInQuantity}</h4>
            <div className="small text-muted">{getPeriodLabel()}</div>
          </div>
          <i className="bi bi-arrow-down-circle"></i>
        </div>

        <div className="dashboard-alert-card dashboard-alert-danger">
          <div>
            <div className="text-muted small">Stock OUT Qty</div>
            <h4 className="mb-0">{dashboardSummary.stockOutQuantity}</h4>
            <div className="small text-muted">{getPeriodLabel()}</div>
          </div>
          <i className="bi bi-arrow-up-circle"></i>
        </div>
      </div>

      {/* Stage 6: Quick actions */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-1">Quick Actions</h5>
              <p className="text-muted mb-0">Open the most used modules quickly.</p>
            </div>
          </div>

          {renderQuickActions()}
        </div>
      </div>

      <div className="dashboard-content-grid mb-3">
        {/* Stage 7: Low-stock and out-of-stock preview */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h5 className="mb-1">Low Stock Preview</h5>
                <p className="text-muted mb-0">Top products needing restock.</p>
              </div>

              <Link className="btn btn-sm btn-outline-primary" to="/inventory">
                View Inventory
              </Link>
            </div>

            {renderStockPreview(lowStockPreview, "LOW")}
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h5 className="mb-1">Out Of Stock Preview</h5>
                <p className="text-muted mb-0">Products currently unavailable.</p>
              </div>

              <Link className="btn btn-sm btn-outline-primary" to="/reports">
                View Reports
              </Link>
            </div>

            {renderStockPreview(outOfStockPreview, "OUT")}
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        {/* Stage 8: Sales summary and recent movements */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h5 className="mb-1">Sales Summary</h5>
                <p className="text-muted mb-0">{getPeriodLabel()} billing overview.</p>
              </div>

              <Link className="btn btn-sm btn-outline-primary" to="/invoices">
                View Invoices
              </Link>
            </div>

            <div className="dashboard-sales-box">
              <div>
                <span>Total Invoices</span>
                <strong>{dashboardSummary.salesCount}</strong>
              </div>

              <div>
                <span>Total Sales</span>
                <strong>{formatPrice(dashboardSummary.salesAmount)}</strong>
              </div>

              <div>
                <span>Average Bill</span>
                <strong>{formatPrice(dashboardSummary.averageBill)}</strong>
              </div>
            </div>

            <div className="dashboard-latest-invoice mt-3">
              <div className="small text-muted mb-1">Latest Invoice</div>

              {latestInvoice ? (
                <div className="d-flex justify-content-between gap-3">
                  <div>
                    <strong>{getInvoiceNumber(latestInvoice)}</strong>
                    <div className="small text-muted">
                      {getCustomerName(latestInvoice)} • {getInvoiceItems(latestInvoice).length} items
                    </div>
                    <div className="small text-muted">
                      {formatDateTime(getInvoiceDate(latestInvoice))}
                    </div>
                  </div>

                  <strong>{formatPrice(getInvoiceTotal(latestInvoice))}</strong>
                </div>
              ) : (
                <p className="mb-0 text-muted">No invoices for this period.</p>
              )}
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h5 className="mb-1">Recent Stock Movements</h5>
                <p className="text-muted mb-0">Latest stock IN and OUT activity.</p>
              </div>

              <Link className="btn btn-sm btn-outline-primary" to="/stock-movements">
                View All
              </Link>
            </div>

            {renderRecentMovements()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;