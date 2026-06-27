import { useEffect, useMemo, useState } from "react";
import inventoryService from "../../services/inventoryService";
import salesService from "../../services/salesService";
import stockMovementService from "../../services/stockMovementService";

function ReportPage() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const [activeReport, setActiveReport] = useState("LOW_STOCK");

  const [lowStockItems, setLowStockItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);
  const [inventoryValueItems, setInventoryValueItems] = useState([]);
  const [inventoryValueTotal, setInventoryValueTotal] = useState(0);
  const [sales, setSales] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);

  const [filterType, setFilterType] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1));
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(currentDate));

  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const monthNames = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const reportTabs = [
    {
      key: "LOW_STOCK",
      label: "Low Stock",
      icon: "bi-exclamation-triangle",
      description: "Products near or below minimum stock",
    },
    {
      key: "OUT_OF_STOCK",
      label: "Out Of Stock",
      icon: "bi-x-octagon",
      description: "Products with zero stock",
    },
    {
      key: "INVENTORY_VALUE",
      label: "Inventory Value",
      icon: "bi-cash-stack",
      description: "Current stock value report",
    },
    {
      key: "SALES_SUMMARY",
      label: "Sales Summary",
      icon: "bi-receipt",
      description: "Invoice and sales report by period",
    },
    {
      key: "STOCK_SUMMARY",
      label: "Stock Movement",
      icon: "bi-arrow-left-right",
      description: "Stock IN and OUT report by period",
    },
  ];

  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

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
    return Number(item?.price ?? item?.sellingPrice ?? product?.price ?? product?.sellingPrice ?? 0);
  };

  const getInventoryQuantity = (item) => {
    return Number(item?.quantity ?? item?.currentQuantity ?? item?.stockQuantity ?? item?.availableStock ?? 0);
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

  const getCustomerName = (invoice) => {
    return invoice?.customerName || invoice?.customer || "Walk-in Customer";
  };

  const getInvoiceDate = (invoice) => {
    return invoice?.createdAt || invoice?.invoiceDate || invoice?.saleDate || invoice?.date;
  };

  const getInvoiceItems = (invoice) => {
    return invoice?.items || invoice?.saleItems || invoice?.invoiceItems || [];
  };

  const getInvoiceTotal = (invoice) => {
    return Number(invoice?.totalAmount ?? invoice?.grandTotal ?? invoice?.amount ?? 0);
  };

  const getItemProductName = (item) => {
    return item?.productName || item?.name || item?.product?.name || "-";
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
        category: movement?.category,
        supplier: movement?.supplier,
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

  const getMovementDate = (movement) => {
    return movement?.movementDate || movement?.createdAt || movement?.updatedAt || movement?.date;
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

  const getWeekRange = (weekNumber) => {
    const week = Number(weekNumber);

    if (week === 1) return { start: 1, end: 7 };
    if (week === 2) return { start: 8, end: 14 };
    if (week === 3) return { start: 15, end: 21 };
    if (week === 4) return { start: 22, end: 28 };

    return { start: 29, end: 31 };
  };

  const isSameDay = (firstDate, secondDate) => {
    return (
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    );
  };

  const isTimeBasedReport = activeReport === "SALES_SUMMARY" || activeReport === "STOCK_SUMMARY";

  // Stage 1: Load report data
  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");
      setWarning("");

      const [
        lowStockResult,
        outOfStockResult,
        inventoryValueResult,
        salesResult,
        movementResult,
      ] = await Promise.allSettled([
        inventoryService.getLowStockReport(),
        inventoryService.getOutOfStockReport(),
        inventoryService.getInventoryValueReport(),
        salesService.getAllSales(),
        stockMovementService.getAllStockMovements(),
      ]);

      if (lowStockResult.status === "fulfilled") {
        setLowStockItems(normalizeList(lowStockResult.value.data));
      }

      if (outOfStockResult.status === "fulfilled") {
        setOutOfStockItems(normalizeList(outOfStockResult.value.data));
      }

      if (inventoryValueResult.status === "fulfilled") {
        const items = normalizeList(inventoryValueResult.value.data);
        setInventoryValueItems(items);
        setInventoryValueTotal(getInventoryValueTotalFromResponse(inventoryValueResult.value.data, items));
      }

      if (salesResult.status === "fulfilled") {
        setSales(normalizeList(salesResult.value.data));
      }

      if (movementResult.status === "fulfilled") {
        setStockMovements(normalizeList(movementResult.value.data));
      }

      const failedCount = [
        lowStockResult,
        outOfStockResult,
        inventoryValueResult,
        salesResult,
        movementResult,
      ].filter((result) => result.status === "rejected").length;

      if (failedCount === 5) {
        setError("Unable to load reports.");
      } else if (failedCount > 0) {
        setWarning("Some reports could not be loaded. Refresh after checking backend APIs.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to load reports.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const availableYears = useMemo(() => {
    const salesYears = sales
      .map((invoice) => new Date(getInvoiceDate(invoice)))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => date.getFullYear());

    const movementYears = stockMovements
      .map((movement) => new Date(getMovementDate(movement)))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => date.getFullYear());

    return [...new Set([...salesYears, ...movementYears, currentYear])].sort(
      (first, second) => second - first
    );
  }, [sales, stockMovements, currentYear]);

  const filterByPeriod = (dateValue) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    if (filterType === "ALL") {
      return true;
    }

    if (filterType === "TODAY") {
      return isSameDay(date, currentDate);
    }

    if (filterType === "YEAR") {
      return date.getFullYear() === Number(selectedYear);
    }

    if (filterType === "MONTH") {
      return (
        date.getFullYear() === Number(selectedYear) &&
        date.getMonth() + 1 === Number(selectedMonth)
      );
    }

    if (filterType === "WEEK") {
      const weekRange = getWeekRange(selectedWeek);

      return (
        date.getFullYear() === Number(selectedYear) &&
        date.getMonth() + 1 === Number(selectedMonth) &&
        date.getDate() >= weekRange.start &&
        date.getDate() <= weekRange.end
      );
    }

    if (filterType === "DAY") {
      const selected = new Date(selectedDate);
      return !Number.isNaN(selected.getTime()) && isSameDay(date, selected);
    }

    return true;
  };

  // Stage 2: Filter sales and stock movement summaries
  const filteredSales = useMemo(() => {
    const keyword = searchKeyword.toLowerCase().trim();

    return sales
      .filter((invoice) => filterByPeriod(getInvoiceDate(invoice)))
      .filter((invoice) => {
        if (activeReport !== "SALES_SUMMARY" || keyword === "") {
          return true;
        }

        const searchText = [
          getInvoiceNumber(invoice),
          getCustomerName(invoice),
          getInvoiceTotal(invoice),
          ...getInvoiceItems(invoice).map((item) => getItemProductName(item)),
        ]
          .join(" ")
          .toLowerCase();

        return searchText.includes(keyword);
      });
  }, [
    sales,
    activeReport,
    searchKeyword,
    filterType,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedDate,
  ]);

  const filteredMovements = useMemo(() => {
    const keyword = searchKeyword.toLowerCase().trim();

    return stockMovements
      .filter((movement) => filterByPeriod(getMovementDate(movement)))
      .filter((movement) => {
        if (activeReport !== "STOCK_SUMMARY" || keyword === "") {
          return true;
        }

        const searchText = [
          getMovementProductName(movement),
          getMovementProductSku(movement),
          getMovementType(movement),
          getMovementQuantity(movement),
          getMovementNote(movement),
        ]
          .join(" ")
          .toLowerCase();

        return searchText.includes(keyword);
      });
  }, [
    stockMovements,
    activeReport,
    searchKeyword,
    filterType,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedDate,
  ]);

  const filteredInventoryReportItems = useMemo(() => {
    const keyword = searchKeyword.toLowerCase().trim();

    let reportItems = [];

    if (activeReport === "LOW_STOCK") {
      reportItems = lowStockItems;
    }

    if (activeReport === "OUT_OF_STOCK") {
      reportItems = outOfStockItems;
    }

    if (activeReport === "INVENTORY_VALUE") {
      reportItems = inventoryValueItems;
    }

    if (keyword === "") {
      return reportItems;
    }

    return reportItems.filter((item) => {
      const searchText = [
        getProductName(item),
        getProductSku(item),
        getProductCategory(item),
        getProductSupplier(item),
        getInventoryQuantity(item),
        getMinimumStock(item),
        getInventoryItemValue(item),
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(keyword);
    });
  }, [
    activeReport,
    lowStockItems,
    outOfStockItems,
    inventoryValueItems,
    searchKeyword,
  ]);

  // Stage 3: Calculate report summaries
  const reportSummary = useMemo(() => {
    const totalSalesAmount = filteredSales.reduce(
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
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      inventoryValue:
        inventoryValueTotal > 0 ? inventoryValueTotal : inventoryValueFromItems,
      salesCount: filteredSales.length,
      salesAmount: totalSalesAmount,
      averageBill:
        filteredSales.length === 0 ? 0 : totalSalesAmount / filteredSales.length,
      stockMovementCount: filteredMovements.length,
      stockInQuantity,
      stockOutQuantity,
      netStockQuantity: stockInQuantity - stockOutQuantity,
    };
  }, [
    lowStockItems,
    outOfStockItems,
    inventoryValueItems,
    inventoryValueTotal,
    filteredSales,
    filteredMovements,
  ]);

  const getSelectedPeriodLabel = () => {
    if (!isTimeBasedReport) return "Current Status";
    if (filterType === "ALL") return "All records";
    if (filterType === "TODAY") return "Today";
    if (filterType === "YEAR") return selectedYear;

    if (filterType === "MONTH") {
      const month = monthNames.find((item) => item.value === selectedMonth);
      return `${month?.label || ""} ${selectedYear}`;
    }

    if (filterType === "WEEK") {
      const month = monthNames.find((item) => item.value === selectedMonth);
      const weekRange = getWeekRange(selectedWeek);

      return `Week ${selectedWeek} (${weekRange.start}-${weekRange.end}) ${month?.label || ""} ${selectedYear}`;
    }

    if (filterType === "DAY") return selectedDate;

    return "Selected period";
  };

  const clearFilters = () => {
    setFilterType("ALL");
    setSelectedYear(String(currentYear));
    setSelectedMonth(String(currentDate.getMonth() + 1));
    setSelectedWeek("1");
    setSelectedDate(formatDateForInput(currentDate));
    setSearchKeyword("");
  };

  const changeReport = (reportKey) => {
    setActiveReport(reportKey);
    setSearchKeyword("");
  };

  const getActiveReportDetails = () => {
    return reportTabs.find((report) => report.key === activeReport);
  };

  const renderStatusBadge = (item, reportType) => {
    if (reportType === "OUT_OF_STOCK") {
      return <span className="badge text-bg-danger">Out Of Stock</span>;
    }

    if (reportType === "LOW_STOCK") {
      return <span className="badge text-bg-warning">Low Stock</span>;
    }

    const quantity = getInventoryQuantity(item);
    const minimumStock = getMinimumStock(item);

    if (quantity === 0) {
      return <span className="badge text-bg-danger">Out Of Stock</span>;
    }

    if (quantity <= minimumStock) {
      return <span className="badge text-bg-warning">Low Stock</span>;
    }

    return <span className="badge text-bg-success">In Stock</span>;
  };

  const renderInventoryReport = () => {
    const reportTitle =
      activeReport === "LOW_STOCK"
        ? "Low Stock Report"
        : activeReport === "OUT_OF_STOCK"
        ? "Out Of Stock Report"
        : "Inventory Value Report";

    if (filteredInventoryReportItems.length === 0) {
      return (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-clipboard-check fs-1"></i>
          <p className="mt-2 mb-0">No records found for this report.</p>
        </div>
      );
    }

    return (
      <div>
        <div className="reports-section-title mb-3">
          <div>
            <h5 className="mb-1">{reportTitle}</h5>
            <p className="text-muted mb-0">
              Showing {filteredInventoryReportItems.length} records
            </p>
          </div>
        </div>

        <div className="reports-card-grid">
          {filteredInventoryReportItems.map((item, index) => (
            <div className="report-data-card" key={`${getProductSku(item)}-${index}`}>
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <h6 className="mb-1">{getProductName(item)}</h6>
                  <div className="small text-muted">SKU: {getProductSku(item)}</div>
                </div>

                {renderStatusBadge(item, activeReport)}
              </div>

              <div className="report-data-meta mt-3">
                <div>
                  <span>Category</span>
                  <strong>{getProductCategory(item)}</strong>
                </div>

                <div>
                  <span>Supplier</span>
                  <strong>{getProductSupplier(item)}</strong>
                </div>

                <div>
                  <span>Quantity</span>
                  <strong>{getInventoryQuantity(item)}</strong>
                </div>

                <div>
                  <span>Minimum Stock</span>
                  <strong>{getMinimumStock(item)}</strong>
                </div>

                {activeReport === "INVENTORY_VALUE" && (
                  <>
                    <div>
                      <span>Unit Price</span>
                      <strong>{formatPrice(getProductPrice(item))}</strong>
                    </div>

                    <div>
                      <span>Total Value</span>
                      <strong>{formatPrice(getInventoryItemValue(item))}</strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSalesSummary = () => {
    if (filteredSales.length === 0) {
      return (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-receipt fs-1"></i>
          <p className="mt-2 mb-0">No sales found for this period.</p>
        </div>
      );
    }

    return (
      <div>
        <div className="reports-section-title mb-3">
          <div>
            <h5 className="mb-1">Sales Summary Report</h5>
            <p className="text-muted mb-0">
              Showing {filteredSales.length} invoices for {getSelectedPeriodLabel()}
            </p>
          </div>
        </div>

        <div className="reports-list">
          {filteredSales.map((invoice) => (
            <div className="reports-list-item" key={getInvoiceId(invoice)}>
              <div>
                <strong>{getInvoiceNumber(invoice)}</strong>
                <div className="small text-muted">{getCustomerName(invoice)}</div>
                <div className="small text-muted">{formatDateTime(getInvoiceDate(invoice))}</div>
              </div>

              <div className="text-end">
                <strong>{formatPrice(getInvoiceTotal(invoice))}</strong>
                <div className="small text-muted">{getInvoiceItems(invoice).length} items</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStockSummary = () => {
    if (filteredMovements.length === 0) {
      return (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-arrow-left-right fs-1"></i>
          <p className="mt-2 mb-0">No stock movements found for this period.</p>
        </div>
      );
    }

    return (
      <div>
        <div className="reports-section-title mb-3">
          <div>
            <h5 className="mb-1">Stock Movement Summary Report</h5>
            <p className="text-muted mb-0">
              Showing {filteredMovements.length} movements for {getSelectedPeriodLabel()}
            </p>
          </div>
        </div>

        <div className="reports-list">
          {filteredMovements.map((movement) => (
            <div className="reports-list-item" key={getMovementId(movement)}>
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
                <div className="fw-semibold mt-1">
                  Qty: {Math.abs(getMovementQuantity(movement))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Stage 4: Render selected report details
  const renderActiveReport = () => {
    if (
      activeReport === "LOW_STOCK" ||
      activeReport === "OUT_OF_STOCK" ||
      activeReport === "INVENTORY_VALUE"
    ) {
      return renderInventoryReport();
    }

    if (activeReport === "SALES_SUMMARY") {
      return renderSalesSummary();
    }

    if (activeReport === "STOCK_SUMMARY") {
      return renderStockSummary();
    }

    return null;
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="mb-0 text-muted">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <div className="d-flex justify-content-between align-items-center">
          <span>{error}</span>

          <button className="btn btn-sm btn-outline-danger" onClick={loadReports}>
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

      {/* Stage 5: Report summary cards */}
      <div className="reports-summary-grid mb-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="reports-summary-icon text-warning">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <div className="text-muted small">Low Stock Items</div>
            <h4 className="mb-0">{reportSummary.lowStockCount}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="reports-summary-icon text-danger">
              <i className="bi bi-x-octagon"></i>
            </div>
            <div className="text-muted small">Out Of Stock Items</div>
            <h4 className="mb-0">{reportSummary.outOfStockCount}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="reports-summary-icon text-success">
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="text-muted small">Inventory Value</div>
            <h4 className="mb-0">{formatPrice(reportSummary.inventoryValue)}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="reports-summary-icon text-primary">
              <i className="bi bi-receipt"></i>
            </div>
            <div className="text-muted small">Sales Amount</div>
            <h4 className="mb-0">{formatPrice(reportSummary.salesAmount)}</h4>
            <div className="small text-muted">{reportSummary.salesCount} invoices</div>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="reports-summary-icon text-info">
              <i className="bi bi-arrow-left-right"></i>
            </div>
            <div className="text-muted small">Stock IN / OUT</div>
            <h6 className="mb-0">
              IN {reportSummary.stockInQuantity} / OUT {reportSummary.stockOutQuantity}
            </h6>
            <div className="small text-muted">
              Net: {reportSummary.netStockQuantity >= 0 ? "+" : ""}
              {reportSummary.netStockQuantity}
            </div>
          </div>
        </div>
      </div>

      {/* Stage 6: Report tabs */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="reports-tabs">
            {reportTabs.map((report) => (
              <button
                type="button"
                key={report.key}
                className={
                  activeReport === report.key
                    ? "reports-tab reports-tab-active"
                    : "reports-tab"
                }
                onClick={() => changeReport(report.key)}
              >
                <i className={`bi ${report.icon}`}></i>

                <span>
                  <strong>{report.label}</strong>
                  <small>{report.description}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stage 7: Calendar and search filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
            <div>
              <h5 className="mb-1">{getActiveReportDetails()?.label}</h5>
              <p className="text-muted mb-0">
                {getActiveReportDetails()?.description} • {getSelectedPeriodLabel()}
              </p>
            </div>

            <button className="btn btn-outline-dark btn-sm" onClick={loadReports}>
              <i className="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>
          </div>

          {isTimeBasedReport && (
            <div className="reports-filter-actions mb-3">
              {["ALL", "TODAY", "YEAR", "MONTH", "WEEK", "DAY"].map((type) => (
                <button
                  key={type}
                  className={
                    filterType === type
                      ? "btn btn-primary btn-sm"
                      : "btn btn-outline-primary btn-sm"
                  }
                  onClick={() => setFilterType(type)}
                >
                  {type === "ALL"
                    ? "All"
                    : type === "TODAY"
                    ? "Today"
                    : type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}

              <button className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
                Clear
              </button>
            </div>
          )}

          <div className="row g-3 align-items-end">
            {isTimeBasedReport &&
              (filterType === "YEAR" ||
                filterType === "MONTH" ||
                filterType === "WEEK") && (
                <div className="col-md-3">
                  <label className="form-label">Year</label>
                  <select
                    className="form-select"
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {isTimeBasedReport &&
              (filterType === "MONTH" || filterType === "WEEK") && (
                <div className="col-md-3">
                  <label className="form-label">Month</label>
                  <select
                    className="form-select"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                  >
                    {monthNames.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

            {isTimeBasedReport && filterType === "WEEK" && (
              <div className="col-md-3">
                <label className="form-label">Week</label>
                <select
                  className="form-select"
                  value={selectedWeek}
                  onChange={(event) => setSelectedWeek(event.target.value)}
                >
                  <option value="1">Week 1: 1 - 7</option>
                  <option value="2">Week 2: 8 - 14</option>
                  <option value="3">Week 3: 15 - 21</option>
                  <option value="4">Week 4: 22 - 28</option>
                  <option value="5">Week 5: 29 - End</option>
                </select>
              </div>
            )}

            {isTimeBasedReport && filterType === "DAY" && (
              <div className="col-md-3">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </div>
            )}

            <div className="col-md-5">
              <label className="form-label">Search Report</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search product, SKU, customer, invoice, note, or amount"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body">{renderActiveReport()}</div>
      </div>
    </div>
  );
}

export default ReportPage;