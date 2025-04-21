// src/hooks/useInventoryFilter.js
import { useState, useCallback, useMemo } from 'react';

// Helper function
const getStockStatusInfo = (stock, minQty) => {
    if (stock <= 0) return { text: "Out of Stock", color: "bg-[#D99292] text-red-800" };
    if (stock < minQty) return { text: "Low Stock", color: "bg-[#F4D98E] text-yellow-800" };
    return { text: "In Stock", color: "bg-[#A3C18F] text-green-800" };
};

const definedStatuses = ["Out of Stock", "Low Stock", "In Stock"];

export function useInventoryFilter(allItems = []) {
  const initialFilterState = useMemo(() => ({ suppliers: [], statuses: [] }), []);
  const [appliedFilters, setAppliedFilters] = useState(initialFilterState);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const openFilterModal = useCallback(() => setIsFilterModalOpen(true), []);
  const closeFilterModal = useCallback(() => setIsFilterModalOpen(false), []);

  const applyFilters = useCallback((filtersFromModal) => {
    setAppliedFilters(filtersFromModal);
    closeFilterModal();
  }, [closeFilterModal]);

  const clearFilters = useCallback(() => {
    setAppliedFilters(initialFilterState);

  }, [initialFilterState]);

  // Calculate available suppliers based on the full dataset
  const availableSuppliers = useMemo(() => {
    const supplierNames = allItems
      .map(item => item.supplier?.supplier_name)
      .filter(Boolean); // Filter out null/undefined names
    return [...new Set(supplierNames)].sort(); // Unique, sorted list
  }, [allItems]);

  // Calculate the number of active filter categories
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.suppliers?.length > 0) count++;
    if (appliedFilters.statuses?.length > 0) count++;
    return count;
  }, [appliedFilters]);

  // Memoize the filter function itself
  const filterItems = useCallback((itemsToFilter) => {
    if (activeFilterCount === 0) {
      return itemsToFilter; // No filters applied, return original list
    }

    return itemsToFilter.filter(item => {
      const supplierMatch = appliedFilters.suppliers.length === 0 ||
        appliedFilters.suppliers.includes(item.supplier?.supplier_name);

      const statusInfo = getStockStatusInfo(item.current_stock, item.min_quantity);
      const statusMatch = appliedFilters.statuses.length === 0 ||
        appliedFilters.statuses.includes(statusInfo.text);

      return supplierMatch && statusMatch;
    });
  }, [appliedFilters, activeFilterCount]); // Recalculate only when filters change


  return {
    appliedFilters,
    isFilterModalOpen,
    openFilterModal,
    closeFilterModal,
    applyFilters,
    clearFilters,
    availableSuppliers,
    availableStatuses: definedStatuses, // Provide static statuses
    activeFilterCount,
    filterItems, // Provide the filtering function
    getStockStatusInfo 
  };
}