import { useEffect, useMemo, useState } from "react";
import salesService from "../../services/salesService";

function InvoicePage() {
  const currentDate = new Date();

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [filterType, setFilterType] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1));
  const [selectedWeek, setSelectedWeek] = useState("1");
  const [selectedDate, setSelectedDate] = useState(formatDateForInput(currentDate));

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

  const getCreatedAt = (invoice) => {
    return (
      invoice?.createdAt ||
      invoice?.invoiceDate ||
      invoice?.saleDate ||
      invoice?.date
    );
  };

  const getInvoiceItems = (invoice) => {
    return invoice?.items || invoice?.saleItems || invoice?.invoiceItems || [];
  };

  const getInvoiceTotal = (invoice) => {
    return Number(
      invoice?.totalAmount ?? invoice?.grandTotal ?? invoice?.amount ?? 0
    );
  };

  const getItemProductName = (item) => {
    return item?.productName || item?.name || item?.product?.name || "-";
  };

  const getItemUnitPrice = (item) => {
    return Number(item?.unitPrice ?? item?.price ?? item?.sellingPrice ?? 0);
  };

  const getItemLineTotal = (item) => {
    const fallbackTotal = getItemUnitPrice(item) * Number(item?.quantity ?? 0);

    return Number(item?.lineTotal ?? item?.total ?? fallbackTotal);
  };

  const normalizeInvoiceList = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.content)) {
      return data.content;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.items)) {
      return data.items;
    }

    return [];
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

  // Stage 1: Load invoice history
  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await salesService.getAllSales();

      const sortedInvoices = normalizeInvoiceList(response.data).sort((first, second) => {
        return new Date(getCreatedAt(second)) - new Date(getCreatedAt(first));
      });

      setInvoices(sortedInvoices);
      setSelectedInvoice(sortedInvoices[0] || null);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Unable to load invoices.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const availableYears = useMemo(() => {
    const years = invoices
      .map((invoice) => new Date(getCreatedAt(invoice)))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map((date) => date.getFullYear());

    const uniqueYears = [...new Set([...years, currentDate.getFullYear()])];

    return uniqueYears.sort((first, second) => second - first);
  }, [invoices]);

  // Stage 2: Filter invoices by period and search
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const createdAt = new Date(getCreatedAt(invoice));

      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }

      let periodMatched = true;

      if (filterType === "TODAY") {
        periodMatched = isSameDay(createdAt, currentDate);
      }

      if (filterType === "YEAR") {
        periodMatched = createdAt.getFullYear() === Number(selectedYear);
      }

      if (filterType === "MONTH") {
        periodMatched =
          createdAt.getFullYear() === Number(selectedYear) &&
          createdAt.getMonth() + 1 === Number(selectedMonth);
      }

      if (filterType === "WEEK") {
        const weekRange = getWeekRange(selectedWeek);

        periodMatched =
          createdAt.getFullYear() === Number(selectedYear) &&
          createdAt.getMonth() + 1 === Number(selectedMonth) &&
          createdAt.getDate() >= weekRange.start &&
          createdAt.getDate() <= weekRange.end;
      }

      if (filterType === "DAY") {
        const selected = new Date(selectedDate);
        periodMatched = !Number.isNaN(selected.getTime()) && isSameDay(createdAt, selected);
      }

      const keyword = searchKeyword.toLowerCase().trim();

      if (keyword === "") {
        return periodMatched;
      }

      const invoiceNumber = getInvoiceNumber(invoice).toLowerCase();
      const customerName = getCustomerName(invoice).toLowerCase();
      const totalAmount = String(getInvoiceTotal(invoice));
      const itemNames = getInvoiceItems(invoice)
        .map((item) => getItemProductName(item).toLowerCase())
        .join(" ");

      const searchMatched =
        invoiceNumber.includes(keyword) ||
        customerName.includes(keyword) ||
        totalAmount.includes(keyword) ||
        itemNames.includes(keyword);

      return periodMatched && searchMatched;
    });
  }, [
    invoices,
    filterType,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedDate,
    searchKeyword,
  ]);

  const selectedInvoiceInFilter = filteredInvoices.some(
    (invoice) => getInvoiceId(invoice) === getInvoiceId(selectedInvoice)
  );

  const invoiceToShow =
    selectedInvoice && selectedInvoiceInFilter
      ? selectedInvoice
      : filteredInvoices[0] || null;

  // Stage 3: Calculate invoice summary
  const summary = useMemo(() => {
    const totalInvoices = filteredInvoices.length;
    const totalSales = filteredInvoices.reduce(
      (total, invoice) => total + getInvoiceTotal(invoice),
      0
    );

    return {
      totalInvoices,
      totalSales,
      averageInvoice: totalInvoices === 0 ? 0 : totalSales / totalInvoices,
    };
  }, [filteredInvoices]);

  const getSelectedPeriodLabel = () => {
    if (filterType === "ALL") return "All invoices";
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
    setSearchKeyword("");
    setSelectedInvoice(invoices[0] || null);
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="mb-0 text-muted">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <div className="d-flex justify-content-between align-items-center">
          <span>{error}</span>

          <button className="btn btn-sm btn-outline-danger" onClick={loadInvoices}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stage 4: Invoice summary cards */}
      <div className="invoice-summary-grid mb-3">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small">Total Invoices</div>
            <h4 className="mb-0">{summary.totalInvoices}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small">Total Sales</div>
            <h4 className="mb-0">{formatPrice(summary.totalSales)}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small">Average Invoice</div>
            <h4 className="mb-0">{formatPrice(summary.averageInvoice)}</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="text-muted small">Selected Period</div>
            <h6 className="mb-0">{getSelectedPeriodLabel()}</h6>
          </div>
        </div>
      </div>

      {/* Stage 5: Report filters */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="invoice-filter-actions mb-3">
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

            <button className="btn btn-outline-dark btn-sm" onClick={loadInvoices}>
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

            <div className="col-md-5">
              <label className="form-label">Search Invoice</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search invoice number, customer, product, or amount"
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="invoice-history-layout">
        {/* Stage 6: Invoice list */}
        <div className="card border-0 shadow-sm invoice-list-panel">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="mb-1">Invoice History</h5>
                <p className="text-muted mb-0">
                  Showing {filteredInvoices.length} of {invoices.length} invoices
                </p>
              </div>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-receipt fs-1"></i>
                <p className="mt-2 mb-0">No invoices found for this filter.</p>
              </div>
            ) : (
              <div className="invoice-list">
                {filteredInvoices.map((invoice) => {
                  const invoiceId = getInvoiceId(invoice);
                  const isActive =
                    getInvoiceId(invoiceToShow) === invoiceId;

                  return (
                    <button
                      type="button"
                      key={invoiceId}
                      className={
                        isActive
                          ? "invoice-list-item invoice-list-item-active"
                          : "invoice-list-item"
                      }
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <div>
                        <strong>{getInvoiceNumber(invoice)}</strong>
                        <div className="small text-muted">
                          {getCustomerName(invoice)}
                        </div>
                        <div className="small text-muted">
                          {formatDateTime(getCreatedAt(invoice))}
                        </div>
                      </div>

                      <div className="text-end">
                        <strong>{formatPrice(getInvoiceTotal(invoice))}</strong>
                        <div className="small text-muted">
                          {getInvoiceItems(invoice).length} items
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Stage 7: Invoice details */}
        <div className="card border-0 shadow-sm invoice-detail-panel">
          <div className="card-body">
            {!invoiceToShow ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-file-earmark-text fs-1"></i>
                <p className="mt-2 mb-0">Select an invoice to view details.</p>
              </div>
            ) : (
              <div>
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <h5 className="mb-1">{getInvoiceNumber(invoiceToShow)}</h5>
                    <p className="text-muted mb-0">
                      {formatDateTime(getCreatedAt(invoiceToShow))}
                    </p>
                  </div>

                  <span className="badge text-bg-success">Completed</span>
                </div>

                <div className="invoice-detail-meta mb-3">
                  <div>
                    <div className="small text-muted">Customer</div>
                    <strong>{getCustomerName(invoiceToShow)}</strong>
                  </div>

                  <div>
                    <div className="small text-muted">Invoice ID</div>
                    <strong>{getInvoiceId(invoiceToShow) || "-"}</strong>
                  </div>

                  <div>
                    <div className="small text-muted">Items</div>
                    <strong>{getInvoiceItems(invoiceToShow).length}</strong>
                  </div>
                </div>

                <div className="invoice-items-list">
                  {getInvoiceItems(invoiceToShow).map((item, index) => (
                    <div className="invoice-item-row" key={index}>
                      <div>
                        <strong>{getItemProductName(item)}</strong>
                        <div className="small text-muted">
                          Qty: {item.quantity} × {formatPrice(getItemUnitPrice(item))}
                        </div>
                      </div>

                      <strong>{formatPrice(getItemLineTotal(item))}</strong>
                    </div>
                  ))}
                </div>

                <div className="invoice-total-box mt-3">
                  <span>Grand Total</span>
                  <strong>{formatPrice(getInvoiceTotal(invoiceToShow))}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicePage;