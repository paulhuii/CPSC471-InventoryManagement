// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, getUserProfile } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for saved token on component mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            console.log('Initial auth check - Token exists:', !!token);

            if (token) {
                try {
                    // Verify the token by getting user profile
                    const userData = await getUserProfile();
                    setUser(userData);
                } catch (error) {
                    console.error('Invalid token, removing it:', error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            // Call the API login function
            const response = await apiLogin({ email, password });
            console.log('Login response:', response);

            if (!response.token) {
                console.error('No token received from server');
                return { success: false, error: 'Authentication failed' };
            }

            // Store token in localStorage
            localStorage.setItem('token', response.token);
            console.log('Token stored in localStorage');

            // Get user information with the token
            const userData = await getUserProfile();
            console.log('User data fetched:', userData);
            setUser(userData);

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed. Please check your credentials.'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Provide these values to all components
    const value = {
        user,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};