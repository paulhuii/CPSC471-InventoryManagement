import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getInventory, addItem, updateItem, deleteItem } from "../api";
import { useAuth } from "../context/AuthContext";
import InventoryItemModal from "./InventoryItemModal";
import FilterModal from "./FilterModal";

const SearchIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const FilterIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);


function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  const getStockStatusInfo = (stock, minQty) => {
    if (stock <= 0) return { text: "Out of Stock", color: "bg-[#D99292] text-red-800" };
    if (stock < minQty) return { text: "Low Stock", color: "bg-[#F4D98E] text-yellow-800" };
    return { text: "In Stock", color: "bg-[#A3C18F] text-green-800" };
  };
  const definedStatuses = ["Out of Stock", "Low Stock", "In Stock"];

  const fetchInventory = useCallback(async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getInventory();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      if (err.response?.status === 401 || err.message.includes("401")) {
        navigate("/login");
      } else {
        setError("Failed to load inventory. Please try again later.");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const availableSuppliers = useMemo(() => {
    const supplierNames = items
        .map(item => item.supplier?.supplier_name)
        .filter(Boolean);
    return [...new Set(supplierNames)].sort();
  }, [items]);

  const displayItems = useMemo(() => {
    let filtered = [...items];

    if (appliedFilters.suppliers && appliedFilters.suppliers.length > 0) {
        filtered = filtered.filter(item =>
            appliedFilters.suppliers.includes(item.supplier?.supplier_name)
        );
    }
    if (appliedFilters.statuses && appliedFilters.statuses.length > 0) {
        filtered = filtered.filter(item => {
            const statusInfo = getStockStatusInfo(item.current_stock, item.min_quantity);
            return appliedFilters.statuses.includes(statusInfo.text);
        });
    }

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
  }, [items, searchTerm, appliedFilters]);

  const handleOpenAddModal = () => {
    setCurrentItem(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    if (!item || typeof item !== "object") {
      console.error("handleOpenEditModal: Invalid item provided", item);
      setError("Could not load item data for editing.");
      return;
    }
    setCurrentItem(item);
    setError(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsFilterModalOpen(false); // Ensure filter modal also closes if needed
    setCurrentItem(null);
    setError(null);
  };

  const handleFormSubmit = async (formData) => {
    const primaryKey = "productid";
    const isEditing = currentItem && currentItem[primaryKey];

    try {
      setLoading(true);
      setError(null);
      if (isEditing) {
        const updatedData = { ...formData, [primaryKey]: currentItem[primaryKey] };
        await updateItem(currentItem[primaryKey], updatedData);
      } else {
        await addItem(formData);
      }
      handleModalClose();
      await fetchInventory();
    } catch (err) {
      console.error(`Error ${isEditing ? "updating" : "adding"} item:`, err);
      setError(`Failed to ${isEditing ? "update" : "add"} item. ${ err.response?.data?.error || err.message || "" }`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const itemToDelete = items.find((item) => item.productid === id);
    if (!itemToDelete) {
      setError("Item not found.");
      return;
    }
    if ( window.confirm(`Are you sure you want to delete "${itemToDelete.product_name || "this item"}"?`) ) {
      try {
        setLoading(true);
        setError(null);
        await deleteItem(id);
        await fetchInventory();
      } catch (err) {
        console.error("Error deleting item:", err);
        setError(`Failed to delete item. ${err.response?.data?.error || ""}`);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenFilterModal = () => setIsFilterModalOpen(true);
  const handleCloseFilterModal = () => setIsFilterModalOpen(false);

  const handleApplyFilters = (filtersFromModal) => {
    setAppliedFilters(filtersFromModal);
    handleCloseFilterModal();
  };

  const handleClearFilters = () => {
    setAppliedFilters({});
  };


  if (loading && items.length === 0) {
    return <div className="p-6 text-center">Loading inventory...</div>;
  }


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-start gap-4">
        <div>
          {user?.role === "admin" && (
            <div className="text-5xl font-medium text-gray-700 mb-2">
              Hello Admin
            </div>
          )}
          <h2 className="text-2xl font-bold text-green-900">Product List</h2>
        </div>

        <div className="flex flex-col items-end gap-2">
            <div className="relative w-full sm:w-72 lg:w-80">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Search inventory items"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-2">
                {Object.keys(appliedFilters).some(key => appliedFilters[key]?.length > 0) && (
                    <button
                        onClick={handleClearFilters}
                        className="p-2 text-sm text-red-600 border border-red-300 rounded-md shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        aria-label="Clear applied filters"
                        title="Clear Filters"
                    >
                        Clear Filters
                    </button>
                )}

                {user?.role === 'admin' && (
                  <button
                      onClick={handleOpenFilterModal}
                      className="p-2 text-gray-600 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      aria-label="Open filters"
                      title="Filters"
                  >
                      <FilterIcon className="h-5 w-5" />
                  </button>
                )}

                {user?.role === 'admin' && (
                  <button
                    onClick={handleOpenAddModal}
                    className="text-black px-4 py-2 rounded shadow whitespace-nowrap"
                    style={{ backgroundColor: "#8DACE5" }}
                  >
                    + Add Product
                  </button>
                )}
            </div>
        </div>
      </div>

      {error && !isModalOpen && !isFilterModalOpen && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
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

      {loading && items.length > 0 && (
        <div className="text-center py-4 text-gray-500">Updating list...</div>
      )}

      <div className="overflow-x-auto bg-gray-100 p-4 rounded-lg shadow">
        <table className="min-w-full text-left">
         <thead>
            <tr className="text-gray-700">
              <th className="px-4 py-2" style={{ backgroundColor: "#D9BE92" }}>Product</th>
              <th className="px-4 py-2" style={{ backgroundColor: "#D9BE92" }}>Quantity</th>
              <th className="px-4 py-2" style={{ backgroundColor: "#D9BE92" }}>Price</th>
              <th className="px-4 py-2" style={{ backgroundColor: "#D9BE92" }}>Stock Status</th>
              <th className="px-4 py-2" style={{ backgroundColor: "#D9BE92" }}>Supplier</th>
              {user?.role === "admin" && (
                <th className="px-4 py-2" style={{ backgroundColor: "#D9BE92" }}>Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {displayItems.length > 0 ? (
              displayItems.map((item) => {
                const { text: statusText, color: statusColor } =
                  getStockStatusInfo(item.current_stock, item.min_quantity);
                return (
                  <tr key={item.productid} className="border-t border-gray-200">
                    <td className="px-4 py-2">{item.product_name}</td>
                    <td className="px-4 py-2">{item.current_stock}</td>
                    <td className="px-4 py-2">${item.case_price?.toFixed(2)}/{item.order_unit}</td>
                    <td className="px-4 py-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="px-4 py-2">{item.supplier?.supplier_name || "N/A"}</td>
                    {user?.role === "admin" && (
                      <td className="px-4 py-2 flex space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="text-white text-sm font-semibold px-3 py-1 rounded hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: "#7E82A4" }}
                          aria-label={`Edit ${item.product_name}`}
                        > Edit </button>
                        <button
                          onClick={() => handleDelete(item.productid)}
                          className="text-white text-sm font-semibold px-3 py-1 rounded hover:opacity-80 transition-opacity"
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
                <td colSpan={user?.role === "admin" ? 6 : 5} className="text-center py-4 text-gray-500">
                  {searchTerm || Object.keys(appliedFilters).some(key => appliedFilters[key]?.length > 0)
                    ? "No products found matching your search/filters."
                    : "No products in inventory."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <InventoryItemModal
          item={currentItem}
          onClose={handleModalClose}
          onSubmit={handleFormSubmit}
          initialError={ error && !error.toLowerCase().includes("load inventory") ? error : null }
        />
      )}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={handleCloseFilterModal}
        onApplyFilters={handleApplyFilters}
        initialFilters={appliedFilters}
        availableSuppliers={availableSuppliers}
        availableStatuses={definedStatuses}
      />

    </div>
  );
}

export default Inventory;