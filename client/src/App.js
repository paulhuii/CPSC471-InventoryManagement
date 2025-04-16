// src/App.js
import React from "react"; // Import React if not already present
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Inventory from "./Inventory";
import Home from "./Home";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminUserListPage from "./components/AdminUserList"; // Import the actual Admin component
import "./styles.css";

// --- Helper Components Defined within App.js ---

// Enhanced ProtectedRoute component (can check roles)
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Authenticating...</div>; // Or a better loading indicator
  }

  if (!user) {
    console.log("ProtectedRoute: No user found, redirecting to login.");
    return <Navigate to="/login" replace />;
  }

  // Check roles if allowedRoles is provided
  if (allowedRoles && !allowedRoles.includes(user.role?.toLowerCase())) {
    // Use lowercase comparison for safety
    console.warn(
      `ProtectedRoute: User with role '${user.role}' denied access. Redirecting.`
    );
    return <Navigate to="/" replace />; // Redirect non-authorized users
  }

  // Render the nested content if authenticated and authorized
  return <Outlet />;
};

// Navigation component
const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav>
      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? "nav-link active" : "nav-link"
        }
        end
      >
        Home
      </NavLink>
      {user ? (
        <>
          <NavLink
            to="/inventory"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Inventory
          </NavLink>
          {/* Use consistent lowercase check for admin role */}
          {user.role?.toLowerCase() === "admin" && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Manage Users
            </NavLink>
          )}
          <button onClick={logout} className="nav-link logout-btn">
            Logout ({user.username || user.email})
          </button>
        </>
      ) : (
        <>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Register
          </NavLink>
        </>
      )}
    </nav>
  );
};

// --- Main App Structure ---

function App() {
  // AppRoutes component handles rendering based on auth state
  const AppRoutes = () => {
    const { user, loading } = useAuth();

    // Display loading state while auth context initializes
    if (loading) {
      return <div className="app-loading">Loading Application...</div>;
    }

    return (
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={!user ? <Login /> : <Navigate to="/inventory" replace />}
            />
            <Route
              path="/register"
              element={
                !user ? <Register /> : <Navigate to="/inventory" replace />
              }
            />

            {/* Protected Routes (Require Login) */}
            <Route element={<ProtectedRoute />}>
              {" "}
              {/* Base protection: must be logged in */}
              <Route path="/inventory" element={<Inventory />} />
              {/* Add other general protected routes here */}
            </Route>

            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              {" "}
              {/* Role protection: must be admin */}
              <Route path="/admin/users" element={<AdminUserListPage />} />
              {/* Add other admin-only routes here */}
            </Route>

            {/* Catch-all Route for unmatched paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    );
  };

  // AuthProvider wraps the entire application
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
