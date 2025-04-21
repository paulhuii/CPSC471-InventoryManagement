// src/App.js
import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  Outlet,
} from "react-router-dom";

// Context Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OrderCartProvider } from "./Main/OrderCartContext";

// Page & Layout Components
import Home from "./Home";
import Login from "./Login/Login";
import Register from "./Login/Register";
import AdminUserListPage from "./Login/AdminUserList";
import Inventory from "./Main/Inventory";
import Order from "./Main/Order"; // Parent layout for /orders/*
import Reports from "./Main/Reports";
import Dashboard from "./Main/Dashboard";

// Order Child Components
import OrderRestock from "./Main/Order/Restock";
import OrderList from "./Main/Order/List";
import OrderPending from "./Main/Order/Pending";
import OrderHistory from "./Main/Order/History";

// --- Reusable Styled Link Component (Desktop & Base for Mobile) ---
const StyledLink = ({ to, end = false, children, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
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

// --- Styled Link Component Specifically for Mobile Panel ---
const StyledMobileLink = ({ to, end = false, children, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
        isActive
          ? "bg-gray-900 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`
    }
  >
    {children}
  </NavLink>
);

// --- Protected Route Component ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-6 text-center text-gray-500">Authenticating…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role?.toLowerCase())) {
    console.warn(`User with role '${user.role}' tried accessing restricted route. Redirecting.`);
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

// --- Main Navigation Bar Component ---
const Navigation = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  return (
    <nav className="bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Side */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
               <span className="text-white font-bold text-lg">471Cafe</span>
            </div>
            <div className="hidden md:block"> {/* Desktop links */}
              <div className="ml-10 flex items-baseline space-x-4">
                {!user && (
                    <StyledLink to="/" end onClick={closeMobileMenu}>Home</StyledLink>
                )}
                {/* ====================================== */}
                {user && <StyledLink to="/dashboard" onClick={closeMobileMenu}>Dashboard</StyledLink>}
                {user && <StyledLink to="/inventory" onClick={closeMobileMenu}>Inventory</StyledLink>}
                {user && <StyledLink to="/orders" onClick={closeMobileMenu}>Orders</StyledLink>}
                {user && <StyledLink to="/reports" onClick={closeMobileMenu}>Reports</StyledLink>} 
                {user?.role?.toLowerCase() === "admin" && (
                  <StyledLink to="/admin/users" onClick={closeMobileMenu}>Manage Users</StyledLink>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Desktop User Actions */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {!user ? ( // If not logged in
                <div className="flex items-baseline space-x-4">
                  <StyledLink to="/login" onClick={closeMobileMenu}>Login</StyledLink>
                  <StyledLink to="/register" onClick={closeMobileMenu}>Register</StyledLink>
                </div>
              ) : ( // If logged in
                <div className="flex items-center space-x-4">
                   <span className="text-gray-300 text-sm font-medium px-3 py-2">
                    Hi, {user.username || user.email} ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <div className={`md:hidden transition-max-height duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-screen' : 'max-h-0'}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {/* Mobile Navigation Links */}
          {/* Conditionally Render Home Link === */}
          {!user && (
            <StyledMobileLink to="/" end onClick={closeMobileMenu}>Home</StyledMobileLink>
          )}
          {/* ====================================== */}
          {user && <StyledMobileLink to="/dashboard" onClick={closeMobileMenu}>Dashboard</StyledMobileLink>}
          {user && <StyledMobileLink to="/inventory" onClick={closeMobileMenu}>Inventory</StyledMobileLink>}
          {user && <StyledMobileLink to="/orders" onClick={closeMobileMenu}>Orders</StyledMobileLink>}
          {user && <StyledMobileLink to="/reports" onClick={closeMobileMenu}>Reports</StyledMobileLink>}
          {user?.role?.toLowerCase() === "admin" && (
            <StyledMobileLink to="/admin/users" onClick={closeMobileMenu}>Manage Users</StyledMobileLink>
          )}
        </div>
        {/* Mobile User Actions */}
        <div className="pt-4 pb-3 border-t border-gray-700">
          {!user ? ( // If not logged in
            <div className="px-2 space-y-1">
              <StyledMobileLink to="/login" onClick={closeMobileMenu}>Login</StyledMobileLink>
              <StyledMobileLink to="/register" onClick={closeMobileMenu}>Register</StyledMobileLink>
            </div>
          ) : ( // If logged in
            <div className="flex items-center px-5 justify-between">
                {/* User Info */}
                <div className="flex items-center">
                 <div className="ml-3">
                   <div className="text-base font-medium leading-none text-white">{user.username || user.email}</div>
                   <div className="text-sm font-medium leading-none text-gray-400 mt-1">{user.role}</div>
                 </div>
                </div>
               {/* Logout Button */}
               <button
                 onClick={handleLogout}
                 className="ml-auto bg-gray-800 flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                 aria-label="Logout"
               >
                 <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                   <title>Logout</title>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                 </svg>
               </button>
             </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- Main Application Component ---
function App() {
  const AppRoutes = () => {
    const { user, loading } = useAuth();
    if (loading) {
      return <div className="flex justify-center items-center h-screen text-lg font-medium text-gray-600">Loading Application…</div>;
    }

    return (
      <OrderCartProvider>
        <div className="min-h-screen flex flex-col bg-gray-100">
          <Navigation />
          <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <Routes>
              {/* Public Routes */}
              {/* Home is now only accessible when logged out, or directly via URL */}
              <Route path="/" element={!user ? <Home /> : <Navigate to="/inventory" replace />} />
              <Route
                path="/login"
                element={!user ? <Login /> : <Navigate to="/inventory" replace />}
              />
              <Route
                path="/register"
                element={!user ? <Register /> : <Navigate to="/inventory" replace />}
              />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} /> 
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/orders" element={<Order />}>
                  <Route index element={<Navigate replace to="restock" />} />
                  <Route path="restock" element={<OrderRestock />} />
                  <Route path="list" element={<OrderList />} />
                  <Route path="pending" element={<OrderPending />} />
                  <Route path="history" element={<OrderHistory />} />
                </Route>
                <Route path="/reports" element={<Reports />} />
              </Route>

              {/* Admin-Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin/users" element={<AdminUserListPage />} />
              </Route>

              {/* Fallback Route */}
              {/* If logged in, unmatched goes to inventory, else to login */}
              <Route path="*" element={<Navigate to={user ? "/inventory" : "/login"} replace />} />
            </Routes>
          </main>
        </div>
      </OrderCartProvider>
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