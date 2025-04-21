// src/Main/Inventory.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getInventory, addItem, updateItem, deleteItem } from "../api";
import { useAuth } from "../context/AuthContext";
import InventoryItemModal from "./InventoryItemModal";
import FilterModal from "./FilterModal"; 
import InventoryHeader from "./InventoryHeader"; 
import { useInventorySearch } from "./hooks/useInventorySearch";
import { useInventoryFilter } from "./hooks/useInventoryFilter"; 
function Inventory() {
  // --- Core State ---
  const [allItems, setAllItems] = useState([]); // Raw data from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- Custom Hooks ---
  const { searchTerm, handleSearchChange } = useInventorySearch();
  const {
    appliedFilters,
    isFilterModalOpen,
    openFilterModal,
    closeFilterModal,
    applyFilters,
    clearFilters,
    availableSuppliers,
    availableStatuses,
    activeFilterCount,
    filterItems, // Function to apply filters
    getStockStatusInfo // Get helper function from hook
  } = useInventoryFilter(allItems); // Pass raw data to the filter hook

  // --- Data Fetching ---
  const fetchInventory = useCallback(async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getInventory();
      setAllItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      if (err.response?.status === 401 || err.message.includes("401")) {
        navigate("/login");
      } else {
        setError("Failed to load inventory. Please try again later.");
      }
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // --- Derived Data: Filtering and Searching ---
  const displayItems = useMemo(() => {
    // 1. Apply Filters first
    let filtered = filterItems(allItems);

    // 2. Apply Search Term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.product_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
          item.supplier?.supplier_name
            ?.toLowerCase()
            .includes(lowerCaseSearchTerm)
      );
    }

    // 3. Sort Results
    return filtered.sort((a, b) =>
      (a.product_name || "").localeCompare(b.product_name || "")
    );
  }, [allItems, searchTerm, filterItems]); // Depend on filterItems function from hook

  // --- Modal Handlers (Add/Edit Item) ---
  const handleOpenAddModal = () => {
    setCurrentItem(null);
    setError(null); // Clear previous errors when opening modal
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    if (!item || typeof item !== "object") {
      console.error("handleOpenEditModal: Invalid item provided", item);
      setError("Could not load item data for editing.");
      return;
    }
    setCurrentItem(item);
    setError(null); // Clear previous errors when opening modal
    setIsItemModalOpen(true);
  };

  const handleItemModalClose = () => {
    setIsItemModalOpen(false);
    setCurrentItem(null);
    // Keep error state if it was set during form submission, otherwise clear it
    // setError(null); // Maybe don't clear error on cancel? Handled in submit/open.
  };

  const handleFormSubmit = async (formData) => {
    const primaryKey = "productid";
    const isEditing = currentItem && currentItem[primaryKey];

    try {
      setLoading(true); // Indicate loading during submit
      setError(null); // Clear previous errors
      if (isEditing) {
        const updatedData = { ...formData, [primaryKey]: currentItem[primaryKey] };
        await updateItem(currentItem[primaryKey], updatedData);
      } else {
        await addItem(formData);
      }
      handleItemModalClose(); // Close modal on success
      await fetchInventory(); // Refresh data
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "adding"} item:`, err);
      // Set error state to be displayed in the modal or main page
      setError(`Failed to ${isEditing ? "update" : "add"} item. ${ err.response?.data?.error || err.message || "" }`);
      // Keep the modal open on error by *not* calling handleItemModalClose here
    } finally {
      // Ensure loading is turned off even if fetchInventory fails after submit
      // setLoading(false); // fetchInventory already handles this
    }
  };

  // --- Delete Handler ---
  const handleDelete = async (id) => {
    const itemToDelete = allItems.find((item) => item.productid === id);
    if (!itemToDelete) {
      setError("Item not found.");
      return;
    }
    if ( window.confirm(`Are you sure you want to delete "${itemToDelete.product_name || "this item"}"?`) ) {
      try {
        setLoading(true);
        setError(null);
        await deleteItem(id);
        await fetchInventory(); // Refresh data
      } catch (err) {
        console.error("Error deleting item:", err);
        setError(`Failed to delete item. ${err.response?.data?.error || ""}`);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
         // setLoading(false); // fetchInventory already handles this
      }
    }
  };


  // --- Render Logic ---
  if (loading && allItems.length === 0) {
    return <div className="p-6 text-center">Loading inventory...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Use the new Header Component */}
      <InventoryHeader
        user={user}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onOpenFilterModal={openFilterModal} // from filter hook
        onClearFilters={clearFilters}       // from filter hook
        onOpenAddModal={handleOpenAddModal}
        activeFilterCount={activeFilterCount} // from filter hook
      />

      {/* Main Error Display (for non-modal errors) */}
      {error && !isItemModalOpen && !isFilterModalOpen && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-700 hover:text-red-900"
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      )}

      {/* Inline Loading Indicator (when list is refreshing) */}
      {loading && allItems.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm italic">Updating list...</div>
      )}

      {/* Inventory Table */}
      <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md"> {/* Changed background */}
        <table className="min-w-full text-left"> {/* Adjusted text size */}
          <thead> 
            <tr className="text-gray-700"> 
              <th className="px-4 py-2 " style={{ backgroundColor: "#D9BE92" }}>Product</th> 
              <th className="px-4 py-2 " style={{ backgroundColor: "#D9BE92" }}>Quantity</th>
              <th className="px-4 py-2 " style={{ backgroundColor: "#D9BE92" }}>Price/Unit</th>
              <th className="px-4 py-2 " style={{ backgroundColor: "#D9BE92" }}>Stock Status</th>
              <th className="px-4 py-2" style={{ backgroundColor: "#D9BE92" }}>Supplier</th>
              {user?.role === "admin" && (
                <th className="px-4 py-2 " style={{ backgroundColor: "#D9BE92" }}>Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200"> {/* Added divider */}
            {displayItems.length > 0 ? (
              displayItems.map((item) => {
                // Use getStockStatusInfo from the filter hook
                const { text: statusText, color: statusColor } =
                  getStockStatusInfo(item.current_stock, item.min_quantity);
                return (
                  <tr key={item.productid} className="hover:bg-gray-50"> {/* Hover effect */}
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{item.product_name}</td>
                    <td className="px-4 py-2 text-gray-700">{item.current_stock}</td>
                    {/* Display price more clearly */}
                    <td className="px-4 py-2 text-gray-700">
                        {item.case_price != null ? `$${item.case_price.toFixed(2)}` : 'N/A'}
                        {item.order_unit ? ` / ${item.order_unit}` : ''}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{item.supplier?.supplier_name || "N/A"}</td>
                    {user?.role === "admin" && (
                      <td className="px-4 py-2 flex space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="text-white text-xs font-semibold px-3 py-1 rounded hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: "#7E82A4" }}
                          aria-label={`Edit ${item.product_name}`}
                        > Edit </button>
                        <button
                          onClick={() => handleDelete(item.productid)}
                          className="text-white text-xs font-semibold px-3 py-1 rounded hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: "#D99292" }}
                          aria-label={`Delete ${item.product_name}`}
                        > Delete </button>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={user?.role === "admin" ? 6 : 5} className="text-center py-6 text-gray-500 italic">
                  {loading ? "Loading..." : (searchTerm || activeFilterCount > 0
                    ? "No products found matching your search/filters."
                    : "No products in inventory.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {isItemModalOpen && (
        <InventoryItemModal
          item={currentItem}
          onClose={handleItemModalClose}
          onSubmit={handleFormSubmit}
          // Pass error state specifically for the modal if it was set during submit
          initialError={ error && (isItemModalOpen || isFilterModalOpen) ? error : null }
        />
      )}

      {/* Filter Modal - Rendered based on hook state */}
      <FilterModal
        isOpen={isFilterModalOpen} // from filter hook
        onClose={closeFilterModal}   // from filter hook
        onApplyFilters={applyFilters} // from filter hook
        initialFilters={appliedFilters} // current filters from hook
        availableSuppliers={availableSuppliers} // from filter hook
        availableStatuses={availableStatuses}   // from filter hook
      />

    </div>
  );
}

export default Inventory;