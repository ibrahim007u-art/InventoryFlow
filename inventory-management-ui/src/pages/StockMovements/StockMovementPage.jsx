import { useEffect, useMemo, useState } from "react";
import stockMovementService from "../../services/stockMovementService";

function StockMovementPage() {
  const currentDate = new Date();

  const [movements, setMovements] = useState([]);
  const [selectedMovement, setSelectedMovement] = useState(null);

  const [filterType, setFilterType] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1));
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(currentDate));

  const [movementTypeFilter, setMovementTypeFilter] = useState("ALL");
  const [selectedProductKey, setSelectedProductKey] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

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

  const normalizeMovementList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.items)) return data.items;

    return [];
  };

  const getMovementId = (movement) => {
    return movement?.id ?? movement?.movementId ?? movement?.stockMovementId;
  };

  const getProduct = (movement) => {
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

  const getProductKey = (movement) => {
    const product = getProduct(movement);

    return String(
      product?.id ??
        product?.productId ??
        product?.sku ??
        product?.name ??
        "UNKNOWN"
    );
  };

  const getProductName = (movement) => {
    const product = getProduct(movement);

    return product?.name || movement?.productName || "Unknown Product";
  };

  const getProductSku = (movement) => {
    const product = getProduct(movement);

    return product?.sku || movement?.sku || "-";
  };

  const getProductCategory = (movement) => {
    const product = getProduct(movement);

    return product?.category?.name || product?.categoryName || movement?.categoryName || "-";
  };

  const getProductSupplier = (movement) => {
    const product = getProduct(movement);

    return product?.supplier?.name || product?.supplierName || movement?.supplierName || "-";
  };

  const getRawMovementType = (movement) => {
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

  const getNormalizedMovementType = (movement) => {
    const rawType = getRawMovementType(movement);
    const quantity = getMovementQuantity(movement);

    if (rawType.includes("ADD") || rawType.includes("IN")) return "IN";
    if (rawType.includes("REMOVE") || rawType.includes("OUT") || rawType.includes("SALE")) return "OUT";
    if (quantity > 0) return "IN";
    if (quantity < 0) return "OUT";

    return rawType || "UNKNOWN";
  };

  const getMovementDate = (movement) => {
    return (
      movement?.movementDate ||
      movement?.createdAt ||
      movement?.updatedAt ||
      movement?.date
    );
  };

  const getMovementNote = (movement) => {
    return (
      movement?.note ||
      movement?.reason ||
      movement?.description ||
      movement?.remarks ||
      "-"
    );
  };

  const getMovementSource = (movement) => {
    const note = getMovementNote(movement).toLowerCase();
    const type = getNormalizedMovementType(movement);

    if (note.includes("sale") || note.includes("invoice")) return "Sale / Billing";
    if (type === "IN") return "Stock Added";
    if (type === "OUT") return "Stock Reduced";

    return "Stock Movement";
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

  const getMovementBadgeClass = (movement) => {
    const type = getNormalizedMovementType(movement);

    if (type === "IN") return "badge text-bg-success";
    if (type === "OUT") return "badge text-bg-danger";

    return "badge text-bg-dark";
  };

  // Stage 1: Load stock movement history
  const loadStockMovements = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await stockMovementService.getAllStockMovements();

      const sortedMovements = normalizeMovementList(response.data).sort(
        (first, second) => {
          return new Date(getMovementDate(second)) - new Date(getMovementDate(first));
        }
      );

      setMovements(sortedMovements);
      setSelectedMovement(sortedMovements[0] || null);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to load stock movements.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockMovements();
  }, []);

  const availableYears = useMemo(() => {
    const years = movements
      .map((movement) => new Date(getMovementDate(movement)))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => date.getFullYear());

    const uniqueYears = [...new Set([...years, currentDate.getFullYear()])];

    return uniqueYears.sort((first, second) => second - first);
  }, [movements]);

  const productOptions = useMemo(() => {
    const productMap = new Map();

    movements.forEach((movement) => {
      const key = getProductKey(movement);

      if (!productMap.has(key)) {
        productMap.set(key, {
          key,
          name: getProductName(movement),
          sku: getProductSku(movement),
        });
      }
    });

    return [...productMap.values()].sort((first, second) =>
      (first.name || "").localeCompare(second.name || "")
    );
  }, [movements]);

  // Stage 2: Filter movements by date, type, product, and search
  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const movementDate = new Date(getMovementDate(movement));

      if (Number.isNaN(movementDate.getTime())) {
        return false;
      }

      let periodMatched = true;

      if (filterType === "TODAY") {
        periodMatched = isSameDay(movementDate, currentDate);
      }

      if (filterType === "YEAR") {
        periodMatched = movementDate.getFullYear() === Number(selectedYear);
      }

      if (filterType === "MONTH") {
        periodMatched =
          movementDate.getFullYear() === Number(selectedYear) &&
          movementDate.getMonth() + 1 === Number(selectedMonth);
      }

      if (filterType === "WEEK") {
        const weekRange = getWeekRange(selectedWeek);

        periodMatched =
          movementDate.getFullYear() === Number(selectedYear) &&
          movementDate.getMonth() + 1 === Number(selectedMonth) &&
          movementDate.getDate() >= weekRange.start &&
          movementDate.getDate() <= weekRange.end;
      }

      if (filterType === "DAY") {
        const selected = new Date(selectedDate);
        periodMatched =
          !Number.isNaN(selected.getTime()) && isSameDay(movementDate, selected);
      }

      const normalizedType = getNormalizedMovementType(movement);
      const typeMatched =
        movementTypeFilter === "ALL" || normalizedType === movementTypeFilter;

      const productMatched =
        selectedProductKey === "ALL" || getProductKey(movement) === selectedProductKey;

      const keyword = searchKeyword.toLowerCase().trim();

      if (keyword === "") {
        return periodMatched && typeMatched && productMatched;
      }

      const searchText = [
        getProductName(movement),
        getProductSku(movement),
        getProductCategory(movement),
        getProductSupplier(movement),
        getRawMovementType(movement),
        getNormalizedMovementType(movement),
        getMovementQuantity(movement),
        getMovementNote(movement),
        getMovementSource(movement),
      ]
        .join(" ")
        .toLowerCase();

      return (
        periodMatched &&
        typeMatched &&
        productMatched &&
        searchText.includes(keyword)
      );
    });
  }, [
    movements,
    filterType,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedDate,
    movementTypeFilter,
    selectedProductKey,
    searchKeyword,
  ]);

  const selectedMovementInFilter = filteredMovements.some(
    (movement) => getMovementId(movement) === getMovementId(selectedMovement)
  );

  const movementToShow =
    selectedMovement && selectedMovementInFilter
      ? selectedMovement
      : filteredMovements[0] || null;

  // Stage 3: Calculate movement summary
  const summary = useMemo(() => {
    let totalInQuantity = 0;
    let totalOutQuantity = 0;

    filteredMovements.forEach((movement) => {
      const type = getNormalizedMovementType(movement);
      const quantity = Math.abs(getMovementQuantity(movement));

      if (type === "IN") {
        totalInQuantity += quantity;
      }

      if (type === "OUT") {
        totalOutQuantity += quantity;
      }
    });

    return {
      totalMovements: filteredMovements.length,
      totalInQuantity,
      totalOutQuantity,
      netQuantity: totalInQuantity - totalOutQuantity,
    };
  }, [filteredMovements]);

  const getSelectedPeriodLabel = () => {
    if (filterType === "ALL") return "All movements";
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
    setSelectedYear(String(currentDate.getFullYear()));
    setSelectedMonth(String(currentDate.getMonth() + 1));
    setSelectedWeek("1");
    setSelectedDate(formatDateForInput(currentDate));
    setMovementTypeFilter("ALL");
    setSelectedProductKey("ALL");
    setSearchKeyword("");
    setSelectedMovement(movements[0] || null);
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="mb-0 text-muted">Loading stock movements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <div className="d-flex justify-content-between align-items-center">
          <span>{error}</span>

          <button className="btn btn-sm btn-outline-danger" onClick={loadStockMovements}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stage 4: Stock movement summary cards */}
      <div className="stock-summary-grid mb-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small">Total Movements</div>
            <h4 className="mb-0">{summary.totalMovements}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small">Stock IN Qty</div>
            <h4 className="mb-0 text-success">{summary.totalInQuantity}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small">Stock OUT Qty</div>
            <h4 className="mb-0 text-danger">{summary.totalOutQuantity}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small">Net Quantity</div>
            <h4
              className={
                summary.netQuantity >= 0
                  ? "mb-0 text-success"
                  : "mb-0 text-danger"
              }
            >
              {summary.netQuantity >= 0 ? `+${summary.netQuantity}` : summary.netQuantity}
            </h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small">Selected Period</div>
            <h6 className="mb-0">{getSelectedPeriodLabel()}</h6>
          </div>
        </div>
      </div>

      {/* Stage 5: Calendar and stock movement filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="stock-filter-actions mb-3">
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

            <button className="btn btn-outline-dark btn-sm" onClick={loadStockMovements}>
              Refresh
            </button>
          </div>

          <div className="row g-3 align-items-end">
            {(filterType === "YEAR" ||
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

            {(filterType === "MONTH" || filterType === "WEEK") && (
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

            {filterType === "WEEK" && (
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

            {filterType === "DAY" && (
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

            <div className="col-md-3">
              <label className="form-label">Movement Type</label>
              <select
                className="form-select"
                value={movementTypeFilter}
                onChange={(event) => setMovementTypeFilter(event.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="IN">Stock IN</option>
                <option value="OUT">Stock OUT</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Product</label>
              <select
                className="form-select"
                value={selectedProductKey}
                onChange={(event) => setSelectedProductKey(event.target.value)}
              >
                <option value="ALL">All Products</option>

                {productOptions.map((product) => (
                  <option key={product.key} value={product.key}>
                    {product.name} {product.sku && product.sku !== "-" ? `(${product.sku})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-5">
              <label className="form-label">Search Movement</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search product, SKU, category, supplier, note, or type"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="stock-movement-layout">
        {/* Stage 6: Stock movement list */}
        <div className="card border-0 shadow-sm stock-movement-list-panel">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-1">Stock Movement History</h5>
                <p className="text-muted mb-0">
                  Showing {filteredMovements.length} of {movements.length} movements
                </p>
              </div>
            </div>

            {filteredMovements.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-clock-history fs-1"></i>
                <p className="mt-2 mb-0">No stock movements found for this filter.</p>
              </div>
            ) : (
              <div className="stock-movement-list">
                {filteredMovements.map((movement) => {
                  const movementId = getMovementId(movement);
                  const isActive = getMovementId(movementToShow) === movementId;
                  const type = getNormalizedMovementType(movement);
                  const quantity = Math.abs(getMovementQuantity(movement));

                  return (
                    <button
                      type="button"
                      key={movementId}
                      className={
                        isActive
                          ? "stock-movement-item stock-movement-item-active"
                          : "stock-movement-item"
                      }
                      onClick={() => setSelectedMovement(movement)}
                    >
                      <div className="stock-movement-main">
                        <div>
                          <strong>{getProductName(movement)}</strong>
                          <div className="small text-muted">
                            SKU: {getProductSku(movement)}
                          </div>
                          <div className="small text-muted">
                            {formatDateTime(getMovementDate(movement))}
                          </div>
                        </div>

                        <div className="text-end">
                          <span className={getMovementBadgeClass(movement)}>
                            {type}
                          </span>
                          <div className="fw-semibold mt-1">Qty: {quantity}</div>
                        </div>
                      </div>

                      <div className="small text-muted mt-2">
                        Source: {getMovementSource(movement)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stage 7: Stock movement details */}
        <div className="card border-0 shadow-sm stock-movement-detail-panel">
          <div className="card-body">
            {!movementToShow ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-file-earmark-text fs-1"></i>
                <p className="mt-2 mb-0">Select a movement to view details.</p>
              </div>
            ) : (
              <div>
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <h5 className="mb-1">{getProductName(movementToShow)}</h5>
                    <p className="text-muted mb-0">
                      {formatDateTime(getMovementDate(movementToShow))}
                    </p>
                  </div>

                  <span className={getMovementBadgeClass(movementToShow)}>
                    {getNormalizedMovementType(movementToShow)}
                  </span>
                </div>

                <div className="stock-movement-detail-meta mb-3">
                  <div>
                    <div className="small text-muted">Movement ID</div>
                    <strong>{getMovementId(movementToShow) || "-"}</strong>
                  </div>

                  <div>
                    <div className="small text-muted">Quantity</div>
                    <strong>{Math.abs(getMovementQuantity(movementToShow))}</strong>
                  </div>

                  <div>
                    <div className="small text-muted">Source</div>
                    <strong>{getMovementSource(movementToShow)}</strong>
                  </div>

                  <div>
                    <div className="small text-muted">SKU</div>
                    <strong>{getProductSku(movementToShow)}</strong>
                  </div>

                  <div>
                    <div className="small text-muted">Category</div>
                    <strong>{getProductCategory(movementToShow)}</strong>
                  </div>

                  <div>
                    <div className="small text-muted">Supplier</div>
                    <strong>{getProductSupplier(movementToShow)}</strong>
                  </div>
                </div>

                <div className="stock-movement-note-box">
                  <div className="small text-muted mb-1">Note / Reason</div>
                  <strong>{getMovementNote(movementToShow)}</strong>
                </div>

                <div className="stock-movement-note-box mt-3">
                  <div className="small text-muted mb-1">Raw Movement Type</div>
                  <strong>{getRawMovementType(movementToShow) || "-"}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockMovementPage;