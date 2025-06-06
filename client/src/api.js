// src/api.js
import axios from "axios";

// Define the base URL without template literals
const BASE_URL = "http://localhost:5000";
const API_URL = `${BASE_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No auth token found in localStorage");
    return {};
  }

  const headers = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  console.log("Using auth header:", headers);
  return headers;
};

export const getInventory = async () => {
  try {
    // Construct the URL properly
    const url = `${API_URL}/inventory`;
    console.log("Fetching products from:", url);
    const response = await axios.get(url, getAuthHeader());
    console.log("Products response:", response.data);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching products:", error.response || error);
    throw error;
  }
};

export const addItem = async (item) => {
  try {
    const url = `${API_URL}/inventory`;
    console.log("Adding product:", item);
    const response = await axios.post(url, item, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error adding product:", error.response || error);
    throw error;
  }
};

export const updateItem = async (id, item) => {
  try {
    const url = `${API_URL}/inventory/${id}`;
    console.log(`Updating product with ID ${id}:`, item);
    const response = await axios.put(url, item, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error(
      `Error updating product with ID ${id}:`,
      error.response || error
    );
    throw error;
  }
};

export const deleteItem = async (id) => {
  try {
    const url = `${API_URL}/inventory/${id}`;
    console.log(`Deleting product with ID ${id}`);
    const response = await axios.delete(url, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error(
      `Error deleting product with ID ${id}:`,
      error.response || error
    );
    throw error;
  }
};

export const createOrder = async (order) => {
  try {
    const url = `${API_URL}/orders`;
    const response = await axios.post(url, order, getAuthHeader());
    return response.data; // should return { orderid, ... }
  } catch (error) {
    console.error("Error creating order:", error.response || error);
    throw error;
  }
};

export const addOrderDetails = async (orderDetailsArray) => {
  try {
    const url = `${API_URL}/order-detail/bulk`;
    const response = await axios.post(url, orderDetailsArray, getAuthHeader());
    return response.data; // should return inserted rows
  } catch (error) {
    console.error(
      "Error inserting bulk order details:",
      error.response || error
    );
    throw error;
  }
};

export const getSuppliers = async () => {
  try {
    const url = `${API_URL}/suppliers`;
    const response = await axios.get(url, getAuthHeader());
    return response.data || [];
  } catch (error) {
    console.error("Error fetching suppliers:", error.response || error);
    throw error;
  }
};

export const createSupplier = async (supplierData) => {
  try {
    const url = `${API_URL}/suppliers`;
    console.log("Creating new supplier:", supplierData);
    const response = await axios.post(url, supplierData, getAuthHeader());
    console.log("Create supplier response:", response.data);
    return response.data; // Should return the newly created supplier object
  } catch (error) {
    console.error("Error creating supplier:", error.response || error);
    throw error; // Re-throw to be handled by the calling component
  }
};

export const getSupplierByName = async (name) => {
  const response = await axios.get(
    `${API_URL}/suppliers?supplier_name=eq.${encodeURIComponent(name)}`,
    getAuthHeader()
  );
  return response.data; // returns an array
};

export const getRestockRecommendations = async () => {
  const url = `${API_URL}/inventory/restock`;
  const response = await axios.get(url, getAuthHeader());
  return response.data || [];
};

export const getPendingOrders = async () => {
  try {
    const url = `${API_URL}/orders/pending`;
    const response = await axios.get(url, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching pending orders:", error.response || error);
    throw error;
  }
};

export const getProcessingOrders = async () => {
  try {
    const url = `${API_URL}/orders/processing`;
    const response = await axios.get(url, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching processing orders:", error.response || error);
    throw error;
  }
};

export const updateOrderStatus = async (orderid, newStatus) => {
  try {
    const url = `${API_URL}/orders/${orderid}/status`;
    const response = await axios.put(
      url,
      { order_status: newStatus },
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    console.error("Error updating order status:", error.response || error);
    throw error;
  }
};

export const getDeliveredOrders = async () => {
  try {
    const url = `${API_URL}/orders/delivered`;
    const response = await axios.get(url, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching delivered orders:", error.response || error);
    throw error;
  }
};

export const addInventoryStock = async (productid, quantity) => {
  const url = `${API_URL}/inventory/${productid}/add-stock`;
  const response = await axios.post(url, { quantity }, getAuthHeader());
  return response.data;
};

// Auth endpoints
export const login = async (credentials) => {
  try {
    const url = `${API_URL}/auth/login`;
    console.log("Logging in with credentials:", credentials);
    const response = await axios.post(url, credentials);
    return response.data;
  } catch (error) {
    console.error("Login error:", error.response || error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const url = `${API_URL}/auth/register`;
    console.log("Registering user with data:", userData);
    const response = await axios.post(url, userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error.response || error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const url = `${API_URL}/users/profile`;
    console.log("Fetching user profile");
    const response = await axios.get(url, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error.response || error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const url = `${API_URL}/users`; // Backend endpoint should be protected by isAdmin middleware
    console.log("Fetching all users (admin) from:", url);
    const response = await axios.get(url, getAuthHeader()); // Requires admin token
    console.log("All users response:", response.data);
    return response.data || []; // Return data or empty array
  } catch (error) {
    console.error("Error fetching all users:", error.response || error);
    throw error; // Re-throw to be caught by the component
  }
};

export const updateUserRole = async (userId, newRole) => {
  // Basic client-side validation
  if (newRole !== "admin" && newRole !== "user") {
    console.error("Invalid role specified in API call:", newRole);
    // Throw an error that the component can catch and display
    throw new Error("Invalid role specified. Must be 'admin' or 'user'.");
  }
  try {
    // Backend endpoint should be protected by isAdmin middleware
    const url = `${API_URL}/users/${userId}/role`;
    console.log(`Updating role for user ${userId} to ${newRole} at:`, url);
    // Send the new role in the request body as expected by the backend
    const response = await axios.put(url, { role: newRole }, getAuthHeader()); // Requires admin token
    console.log("Update user role response:", response.data); // Should return the updated user object
    return response.data;
  } catch (error) {
    console.error(
      `Error updating role for user ${userId}:`,
      error.response || error
    );
    throw error; // Re-throw to be caught by the component
  }
};

export const getReportSummary = async () => {
  try {
    const url = `${API_URL}/reports/summary`;
    console.log("Fetching report summary from:", url);
    const response = await axios.get(url, getAuthHeader()); // Assumes reports require authentication
    console.log("Report Summary response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching report summary:", error.response || error);
    throw error; // Re-throw for the component to handle
  }
};

export const deleteUser = async (userId) => {
  const url = `${API_URL}/users/${userId}`;
  const response = await axios.delete(url, getAuthHeader());
  return response.data;
};

export const getMonthlyTopProducts = async (year, month, limit = 5) => {
  try {
    // Construct query parameters
    const params = new URLSearchParams({ year, month, limit });
    const url = `${API_URL}/reports/monthly-top-products?${params.toString()}`;

    console.log("Fetching monthly top products from:", url);
    const response = await axios.get(url, getAuthHeader()); // Assumes reports require authentication
    console.log("Monthly Top Products response:", response.data);
    return response.data; // Expects an array like [{ id, name, count }]
  } catch (error) {
    console.error(`Error fetching monthly top products for ${year}-${month}:`, error.response || error);
    throw error; // Re-throw for the component to handle
  }
};