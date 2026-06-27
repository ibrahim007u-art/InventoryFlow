import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";

import LoginPage from "../pages/Auth/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import SalesPage from "../pages/Sales/SalesPage";
import ProductPage from "../pages/Products/ProductPage";
import InventoryPage from "../pages/Inventory/InventoryPage";
import CategoryPage from "../pages/Categories/CategoryPage";
import SupplierPage from "../pages/Suppliers/SupplierPage";
import StockMovementPage from "../pages/StockMovements/StockMovementPage";
import ReportPage from "../pages/Reports/ReportPage";
import InvoicePage from "../pages/Invoices/InvoicePage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/suppliers" element={<SupplierPage />} />
          <Route path="/stock-movements" element={<StockMovementPage />} />
          <Route path="/reports" element={<ReportPage />} />
          <Route path="/invoices" element={<InvoicePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;