import { NavLink } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: "bi-speedometer2",
    },
    {
      path: "/sales",
      label: "Sales / Billing",
      icon: "bi-cart-check",
    },
    {
      path: "/products",
      label: "Products",
      icon: "bi-box-seam",
    },
    {
      path: "/inventory",
      label: "Inventory",
      icon: "bi-building",
    },
    {
      path: "/categories",
      label: "Categories",
      icon: "bi-folder",
    },
    {
      path: "/suppliers",
      label: "Suppliers",
      icon: "bi-truck",
    },
    {
      path: "/stock-movements",
      label: "Stock Movements",
      icon: "bi-arrow-left-right",
    },
    {
      path: "/reports",
      label: "Reports",
      icon: "bi-graph-up-arrow",
    },
    {
      path: "/invoices",
      label: "Invoices",
      icon: "bi-receipt",
    },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <i className="bi bi-box-seam-fill me-2"></i>
        InventoryFlows
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <i className={`bi ${item.icon} me-2`}></i>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;