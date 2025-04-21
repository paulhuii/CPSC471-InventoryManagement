import { useState, useCallback } from 'react';

export function useInventorySearch(initialTerm = '') {
  const [searchTerm, setSearchTerm] = useState(initialTerm);

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  // Optional: Function to clear search externally if needed
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return { searchTerm, handleSearchChange, clearSearch };
}