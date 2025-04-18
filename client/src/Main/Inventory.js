import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInventory, addItem, updateItem, deleteItem } from '../api';
import { useAuth } from '../context/AuthContext';

function InventoryItemModal({ item, onClose, onSubmit, initialError }) {
    // Determine if we are editing (item exists) or adding (item is null)
    const isEditing = item !== null;

    const [formData, setFormData] = useState({
        product_name: item?.product_name || '',
        case_quantity: item?.case_quantity ?? '', 
        order_unit: item?.order_unit || '',
        case_price: item?.case_price ?? '',
        current_stock: item?.current_stock ?? '',
        max_quantity: item?.max_quantity ?? '',
        min_quantity: item?.min_quantity ?? '',
        // Format date for input type="date" (YYYY-MM-DD)
        expiration: item?.expiration ? new Date(item.expiration).toISOString().split('T')[0] : '',
        categoryid: item?.categoryid ?? '',
        supplierid: item?.supplierid ?? '',

    });
    const [error, setError] = useState(initialError); // Local error state for the modal

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        // Handle number inputs appropriately
        const val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
        // Allow empty strings for optional number fields during input
        const finalValue = (name === 'categoryid' || name === 'supplierid' || name === 'case_quantity' || name === 'case_price' || name === 'current_stock' || name === 'max_quantity' || name === 'min_quantity') && val === '' ? '' : val;

        setFormData(prev => ({ ...prev, [name]: finalValue }));
        setError(null); // Clear error on change
    };

     const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors

        // Basic Validation Example (Expand as needed)
        if (!formData.product_name || formData.case_price === '' || formData.current_stock === '') {
            setError("Product Name, Case Price, and Current Stock are required.");
            return;
        }

        // Prepare data for submission: convert empty strings for optional numbers/IDs to null
        const dataToSubmit = { ...formData };
        for (const key of ['case_quantity', 'case_price', 'current_stock', 'max_quantity', 'min_quantity', 'categoryid', 'supplierid']) {
            if (dataToSubmit[key] === '') {
                dataToSubmit[key] = null;
            }
        }
         // If expiration is empty string, set it to null for Supabase
        if (dataToSubmit.expiration === '') dataToSubmit.expiration = null;

        // Call the onSubmit prop passed from Inventory component
        try {
            // onSubmit internally calls addItem or updateItem
            await onSubmit(dataToSubmit);
             // Let the parent handle closing on success
        } catch (err) {
             // Parent component will likely catch and set error, but we can set local too
             setError(err.response?.data?.error || err.message || "An unexpected error occurred.");
             console.error("Modal Submit Error:", err);
        }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-semibold text-gray-800">{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
              <button onClick={() => setError(null)} className="absolute top-0 right-0 px-2 py-1 text-red-500">×</button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Product Name *', name: 'product_name', type: 'text' },
              { label: 'Case Quantity', name: 'case_quantity', type: 'number' },
              { label: 'Order Unit', name: 'order_unit', type: 'text' },
              { label: 'Case Price *', name: 'case_price', type: 'number', step: '0.01' },
              { label: 'Current Stock *', name: 'current_stock', type: 'number' },
              { label: 'Max Quantity', name: 'max_quantity', type: 'number' },
              { label: 'Min Quantity', name: 'min_quantity', type: 'number' },
              { label: 'Expiration Date', name: 'expiration', type: 'date' },
              { label: 'Category ID', name: 'categoryid', type: 'number' },
              { label: 'Supplier ID', name: 'supplierid', type: 'number' },
            ].map(({ label, name, type, step }) => (
              <input
                key={name}
                className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={label}
                name={name}
                type={type}
                step={step}
                value={formData[name]}
                onChange={handleChange}
                required={label.includes('*')}
              />
            ))}

            <div className="col-span-2 flex justify-end gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">
                {isEditing ? 'Update Item' : 'Add Item'}
              </button>
              <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-black font-semibold px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}


// --- Main Inventory Component ---
function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null); // For editing/adding
    const navigate = useNavigate();
    const { user } = useAuth(); // Get user from context

    // Fetch inventory logic (using useCallback for stability)
    const fetchInventory = useCallback(async () => {
        if (!user) { 
            navigate('/login');
            return;
        }
        try {
            setLoading(true);
            setError(null); // Clear previous errors
            const data = await getInventory();
            console.log('Received inventory data:', data);
            // Ensure data is always an array; use primary key from data for consistency
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching inventory:', err);
            if (err.response?.status === 401 || err.message.includes('401')) { // Check message too
                // Handle potential logout or token expiry implicitly
                 console.log('Auth error fetching inventory, redirecting to login.');
                 // Consider calling logout() from useAuth here if token is invalid
                 navigate('/login');
            } else {
                setError('Failed to load inventory. Please try again later.');
            }
            setItems([]); // Clear items on error
        } finally {
            setLoading(false);
        }
    }, [user, navigate]); // Add dependencies

    // Effect to fetch inventory on mount or when fetchInventory changes
    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]); // fetchInventory is the dependency

    const handleOpenAddModal = () => {
        setCurrentItem(null); // No item means "add mode"
        setError(null); // Clear errors when opening modal
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item) => {
        // Ensure you're passing the correct item object
        if (!item || typeof item !== 'object') {
             console.error("handleOpenEditModal: Invalid item provided", item);
             setError("Could not load item data for editing.");
             return;
        }
        console.log("Editing Item:", item);
        setCurrentItem(item); // Set the item to be edited
        setError(null); // Clear errors
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setCurrentItem(null); // Reset item state
        setError(null); // Optionally clear error when closing manually
    };

    // --- CRUD Handlers ---
    const handleFormSubmit = async (formData) => {
        // This function is passed to the modal's onSubmit prop
         const primaryKey = 'productID'; // <<<--- CONFIRM YOUR PRIMARY KEY COLUMN NAME
         const isEditing = currentItem && currentItem[primaryKey];

        try {
            setLoading(true); // Indicate activity
             if (isEditing) {
                 console.log(`Updating item ${currentItem[primaryKey]} with data:`, formData);
                await updateItem(currentItem[primaryKey], formData);
            } else {
                 console.log("Adding new item with data:", formData);
                await addItem(formData);
            }
            handleModalClose(); // Close modal on success
            await fetchInventory(); // Refetch data to show changes
        } catch (err) {
            console.error(`Error ${isEditing ? 'updating' : 'adding'} item:`, err);
            setError(`Failed to ${isEditing ? 'update' : 'add'} item. ${err.response?.data?.error || ''}`);
            // Don't close modal on error, let the modal display it
            throw err; // Re-throw error so modal's catch block can handle it
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async (id) => {
         const primaryKey = 'productID'; 
         const itemToDelete = items.find(item => item[primaryKey] === id);

        if (!itemToDelete) {
            setError("Item not found.");
            return;
        }

        // Confirmation dialog
        if (window.confirm(`Are you sure you want to delete "${itemToDelete.product_name || 'this item'}"?`)) {
            try {
                setLoading(true);
                setError(null);
                await deleteItem(id);
                await fetchInventory(); // Refetch after successful delete
            } catch (err) {
                console.error('Error deleting item:', err);
                setError(`Failed to delete item. ${err.response?.data?.error || ''}`);
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                 setLoading(false);
            }
        }
    };

    console.log('--- Inventory Component Debug ---');
    console.log('User object from useAuth:', user);
    console.log('User role:', user?.role);
    console.log('Is admin check:', user?.role === 'admin');
    console.log('---------------------------------');

    // --- Render Logic ---
    if (loading && items.length === 0) { // Show loading only on initial load
        return <div className="loading">Loading inventory...</div>;
    }

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          {user?.role === 'admin' && (
            <button onClick={handleOpenAddModal} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow">
              + Add New Item
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError(null)} className="float-right text-lg font-bold">×</button>
          </div>
        )}

            {/* Product List */}
             <div className="overflow-x-auto bg-white shadow rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Product Name</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Stock</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Order Unit</th>
                    <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Expires</th>
                    {user?.role === 'admin' && <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const itemKey = item.productID || item.productid || item.id;
                    return (
                      <tr key={itemKey}>
                        <td className="px-4 py-2">{item.product_name}</td>
                        <td className="px-4 py-2">{item.current_stock ?? 'N/A'}</td>
                        <td className="px-4 py-2">${item.case_price?.toFixed(2) ?? 'N/A'}</td>
                        <td className="px-4 py-2">{item.order_unit || 'N/A'}</td>
                        <td className="px-4 py-2">{item.expiration ? new Date(item.expiration).toLocaleDateString() : 'N/A'}</td>
                        {user?.role === 'admin' && (
                          <td className="px-4 py-2 flex space-x-2">
                            <button onClick={() => handleOpenEditModal(item)} className="text-blue-600 hover:underline">Edit</button>
                            <button onClick={() => handleDelete(itemKey)} className="text-red-600 hover:underline">Delete</button>
                          </td>
                        )}
                      </tr>
                    );
                  })}

                </tbody>
              </table>
            </div>

            {/* Render Modal Conditionally */}
            {isModalOpen && (
                <InventoryItemModal
                    item={currentItem} // Pass null for adding, item object for editing
                    onClose={handleModalClose}
                    onSubmit={handleFormSubmit}
                    initialError={null} // Let modal handle its own errors primarily
                />
            )}
        </div>
    );
}

export default Inventory;