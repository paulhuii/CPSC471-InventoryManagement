// src/api.js
import axios from 'axios';

// Define the base URL without template literals
const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No auth token found in localStorage');
        return {};
    }

    const headers = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
    console.log('Using auth header:', headers);
    return headers;
};

export const getInventory = async () => {
    try {
        // Construct the URL properly
        const url = `${API_URL}/inventory`;
        console.log('Fetching products from:', url);
        const response = await axios.get(url, getAuthHeader());
        console.log('Products response:', response.data);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching products:', error.response || error);
        throw error;
    }
};

export const addItem = async (item) => {
    try {
        const url = `${API_URL}/inventory`;
        console.log('Adding product:', item);
        const response = await axios.post(url, item, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error('Error adding product:', error.response || error);
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
        console.error(`Error updating product with ID ${id}:`, error.response || error);
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
        console.error(`Error deleting product with ID ${id}:`, error.response || error);
        throw error;
    }
};

// Auth endpoints
export const login = async (credentials) => {
    try {
        const url = `${API_URL}/auth/login`;
        console.log('Logging in with credentials:', credentials);
        const response = await axios.post(url, credentials);
        return response.data;
    } catch (error) {
        console.error('Login error:', error.response || error);
        throw error;
    }
};

export const register = async (userData) => {
    try {
        const url = `${API_URL}/auth/register`;
        console.log('Registering user with data:', userData);
        const response = await axios.post(url, userData);
        return response.data;
    } catch (error) {
        console.error('Registration error:', error.response || error);
        throw error;
    }
};

export const getUserProfile = async () => {
    try {
        const url = `${API_URL}/users/profile`;
        console.log('Fetching user profile');
        const response = await axios.get(url, getAuthHeader());
        return response.data;
    } catch (error) {
        console.error('Error fetching user profile:', error.response || error);
        throw error;
    }
};