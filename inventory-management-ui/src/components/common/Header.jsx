import { useLocation, useNavigate } from "react-router-dom";
import { getUser, removeAuthData } from "../../utils/authUtil";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = getUser();

  const pageTitles = {
    "/dashboard": {
      title: "Dashboard",
      subtitle: "Quick business summary for the shop",
    },
    "/sales": {
      title: "Sales / Billing",
      subtitle: "Create bills, manage cart, and complete sales",
    },
    "/products": {
      title: "Products",
      subtitle: "Manage product details, SKU, price, category, and supplier",
    },
    "/inventory": {
      title: "Inventory",
      subtitle: "Track current stock, low stock, and out-of-stock products",
    },
    "/categories": {
      title: "Categories",
      subtitle: "Manage product categories",
    },
    "/suppliers": {
      title: "Suppliers",
      subtitle: "Manage supplier and distributor details",
    },
    "/stock-movements": {
      title: "Stock Movements",
      subtitle: "View stock IN and OUT history",
    },
    "/reports": {
      title: "Reports",
      subtitle: "View low stock, out-of-stock, and inventory value reports",
    },
    "/invoices": {
      title: "Invoices",
      subtitle: "View completed sales bills and invoice history",
    },
  };

  const currentPage = pageTitles[location.pathname] || {
    title: "InventoryFlow",
    subtitle: "SMB Inventory Management System",
  };

  const roleBadgeClass =
    user?.role === "ADMIN" ? "text-bg-primary" : "text-bg-success";

  const handleLogout = () => {
    removeAuthData();
    navigate("/login", { replace: true });
  };

  return (
    <header className="app-header">
      <div>
        <h5 className="mb-0">{currentPage.title}</h5>
        <small className="text-muted">{currentPage.subtitle}</small>
      </div>

      <div className="header-user-area">
        <div className="text-end d-none d-md-block">
          <small className="text-muted d-block">Logged in user</small>
          <strong>{user?.name || user?.email || "Unknown User"}</strong>
        </div>

        <span className={`badge ${roleBadgeClass}`}>
          {user?.role || "NO ROLE"}
        </span>

        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-1"></i>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;