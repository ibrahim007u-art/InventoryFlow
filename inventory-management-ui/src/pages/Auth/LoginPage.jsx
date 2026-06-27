import { useState } from "react";
import { useNavigate } from "react-router-dom";

import authService from "../../services/authService";
import { saveAuthData } from "../../utils/authUtil";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (email.trim() === "") {
      setError("Email is required.");
      return;
    }

    if (password.trim() === "") {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await authService.login(email, password);

      saveAuthData(response.data);

      navigate("/dashboard");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Login failed. Please check your email and password.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="card shadow-sm border-0" style={{ width: "420px" }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <i className="bi bi-box-seam-fill text-primary fs-1"></i>
            <h3 className="mt-2 mb-1">InventoryFlow</h3>
            <p className="text-muted mb-0">SMB Inventory Management System</p>
          </div>

          <h5 className="mb-3">Login</h5>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
                value={email}
                disabled={loading}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                disabled={loading}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-muted text-center mt-3 mb-0">
            Use your registered ADMIN or STAFF account to sign in.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;