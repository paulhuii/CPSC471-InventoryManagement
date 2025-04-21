// client/src/Main/Inventory.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// NOTE: Removed 'addItem' from import as it's no longer used here
import { getInventory, updateItem, deleteItem } from "../api";
import { useAuth } from "../context/AuthContext";
import InventoryItemModal from "./InventoryItemModal";
import FilterModal from "./FilterModal";
import InventoryHeader from "./InventoryHeader";
import { useInventorySearch } from "./hooks/useInventorySearch";
import { useInventoryFilter } from "./hooks/useInventoryFilter";

function Inventory() {
  // --- Core State ---
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null); // Used only for editing now
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
    filterItems,
    getStockStatusInfo
  } = useInventoryFilter(allItems);

  // --- Data Fetching ---
  const fetchInventory = useCallback(async () => {
    // ... (fetchInventory logic remains the same) ...
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
    // ... (displayItems logic remains the same) ...
    let filtered = filterItems(allItems);

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

    return filtered.sort((a, b) =>
      (a.product_name || "").localeCompare(b.product_name || "")
    );
  }, [allItems, searchTerm, filterItems]);

  // --- Modal Handlers (Edit Item ONLY) ---
  // REMOVED handleOpenAddModal function

  const handleOpenEditModal = (item) => {
    if (!item || typeof item !== "object") {
      console.error("handleOpenEditModal: Invalid item provided", item);
      setError("Could not load item data for editing.");
      return;
    }
    setCurrentItem(item); // Set the item to be edited
    setError(null);
    setIsItemModalOpen(true); // Open the modal
  };

  const handleItemModalClose = () => {
    setIsItemModalOpen(false);
    setCurrentItem(null); // Clear the item being edited
    // setError(null); // Decide if you want to clear error on cancel
  };

  // SIMPLIFIED handleFormSubmit for UPDATE ONLY
  const handleFormSubmit = async (formData) => {
    const primaryKey = "productid";
    // Check if we are actually editing (currentItem should be set)
    if (!currentItem || !currentItem[primaryKey]) {
        console.error("handleFormSubmit called without a currentItem for editing.");
        setError("Cannot update item: No item selected for editing.");
        return; // Exit if not in edit mode
    }

    try {
      setLoading(true);
      setError(null);
      // Prepare data for update
      const updatedData = { ...formData, [primaryKey]: currentItem[primaryKey] };
      // Call the update API
      await updateItem(currentItem[primaryKey], updatedData);

      handleItemModalClose(); // Close modal on success
      await fetchInventory(); // Refresh data
    } catch (err) {
      console.error(`Error updating item:`, err);
      setError(`Failed to update item. ${ err.response?.data?.error || err.message || "" }`);
      // Keep modal open on error
    } finally {
      // setLoading(false); // fetchInventory handles this
    }
  };

  // --- Delete Handler ---
  const handleDelete = async (id) => {
    // ... (handleDelete logic remains the same) ...
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
      {/* Use the Header Component (without Add button functionality) */}
      <InventoryHeader
        user={user}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onOpenFilterModal={openFilterModal}
        onClearFilters={clearFilters}
        // onOpenAddModal prop removed
        activeFilterCount={activeFilterCount}
      />

      {/* ... (Error display logic) ... */}
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

      {/* ... (Loading indicator logic) ... */}
       {loading && allItems.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm italic">Updating list...</div>
      )}

      {/* ... (Inventory Table rendering logic remains the same) ... */}
      <div className="overflow-x-auto bg-white p-4 rounded-lg shadow-md">
          <table className="min-w-full text-left text-sm">
             {/* ... thead ... */}
             <thead className="bg-gray-50">
                 <tr className="text-gray-600 uppercase text-xs">
                     <th className="px-4 py-2 font-medium" style={{ backgroundColor: "#EAE0D5" }}>Product</th>
                     <th className="px-4 py-2 font-medium" style={{ backgroundColor: "#EAE0D5" }}>Quantity</th>
                     <th className="px-4 py-2 font-medium" style={{ backgroundColor: "#EAE0D5" }}>Price/Unit</th>
                     <th className="px-4 py-2 font-medium" style={{ backgroundColor: "#EAE0D5" }}>Stock Status</th>
                     <th className="px-4 py-2 font-medium" style={{ backgroundColor: "#EAE0D5" }}>Supplier</th>
                     {user?.role === "admin" && (
                       <th className="px-4 py-2 font-medium" style={{ backgroundColor: "#EAE0D5" }}>Action</th>
                     )}
                 </tr>
             </thead>
             {/* ... tbody ... */}
             <tbody className="divide-y divide-gray-200">
                 {displayItems.length > 0 ? (
                     displayItems.map((item) => {
                         const { text: statusText, color: statusColor } =
                           getStockStatusInfo(item.current_stock, item.min_quantity);
                         return (
                             <tr key={item.productid} className="hover:bg-gray-50">
                                 <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-900">{item.product_name}</td>
                                 <td className="px-4 py-2 text-gray-700">{item.current_stock}</td>
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
                                         {/* Edit button triggers handleOpenEditModal */}
                                         <button
                                           onClick={() => handleOpenEditModal(item)}
                                           className="text-white text-xs font-semibold px-3 py-1 rounded hover:opacity-80 transition-opacity"
                                           style={{ backgroundColor: "#7E82A4" }}
                                           aria-label={`Edit ${item.product_name}`}
                                         > Edit </button>
                                         {/* Delete button triggers handleDelete */}
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
                    /* ... No items row ... */
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
      {/* InventoryItemModal */}
      {isItemModalOpen && currentItem && ( 
        <InventoryItemModal
          item={currentItem} // Pass the item to be edited
          onClose={handleItemModalClose}
          onSubmit={handleFormSubmit} // Submits only updates now
          initialError={ error && isItemModalOpen ? error : null }
          isQuickAdd={false} // Explicitly false for editing
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={closeFilterModal}
        onApplyFilters={applyFilters}
        initialFilters={appliedFilters}
        availableSuppliers={availableSuppliers}
        availableStatuses={availableStatuses}
      />

    </div>
  );
}

export default Inventory;