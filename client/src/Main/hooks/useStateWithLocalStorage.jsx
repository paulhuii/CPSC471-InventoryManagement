// src/hooks/useStateWithLocalStorage.js
import { useState, useEffect } from 'react';

export function useStateWithLocalStorage(key, initialValue) {

  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (error) {
      console.error("Error reading localStorage key “" + key + "”:", error);
      return initialValue; 
    }
  });

  // Use useEffect to update localStorage whenever the key or value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting localStorage key “" + key + "”:", error);
    }
  }, [key, value]); 

  return [value, setValue]; // Return the state value and setter function
}