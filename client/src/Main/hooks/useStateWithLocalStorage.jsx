// src/hooks/useStateWithLocalStorage.js
import { useState, useEffect } from 'react';

// This custom hook manages state persisted in localStorage.
export function useStateWithLocalStorage(key, initialValue) {
  // Initialize state using a function to read from localStorage only once
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      // Parse stored json or return initialValue if nothing is saved or error occurs
      return saved ? JSON.parse(saved) : initialValue;
    } catch (error) {
      console.error("Error reading localStorage key “" + key + "”:", error);
      return initialValue; // Fallback to initial value on error
    }
  });

  // Use useEffect to update localStorage whenever the key or value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting localStorage key “" + key + "”:", error);
    }
  }, [key, value]); // Dependencies array ensures effect runs only when key or value changes

  return [value, setValue]; // Return the state value and setter function
}