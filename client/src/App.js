// src/App.js 
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Inventory from "./Main/Inventory";
import Home from "./Home";
import Login from "./Login/Login";
import Register from "./Login/Register";
import AdminUserListPage from "./Login/AdminUserList";

const StyledLink = ({ to, end = false, children }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-gray-900 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`
    }
  >
    {children}
  </NavLink>
);


const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6 text-center">Authenticating…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role?.toLowerCase()))
    return <Navigate to="/" replace />;
  return <Outlet />;
};

const Navigation = () => {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left links */}
          <div className="flex space-x-4">
            <StyledLink to="/" end>
              Home
            </StyledLink>

            {user && (
              <StyledLink to="/inventory">Inventory</StyledLink>
            )}

            {user?.role?.toLowerCase() === "admin" && (
              <StyledLink to="/admin/users">Manage Users</StyledLink>
            )}
          </div>

          {/* Right links */}
          <div className="flex items-center space-x-4">
            {!user && (
              <>
                <StyledLink to="/login">Login</StyledLink>
                <StyledLink to="/register">Register</StyledLink>
              </>
            )}

            {user && (
              <button
                onClick={logout}
                className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout ({user.username || user.email})
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};


function App() {
  const AppRoutes = () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-6 text-center">Loading Application…</div>;

    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={!user ? <Login /> : <Navigate to="/inventory" replace />} />
            <Route
              path="/register"
              element={!user ? <Register /> : <Navigate to="/inventory" replace />} />

            {/* Protected (any logged‑in user) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/inventory" element={<Inventory />} />
            </Route>

            {/* Admin‑only */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/users" element={<AdminUserListPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    );
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
