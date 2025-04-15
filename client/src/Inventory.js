import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInventory, addItem, updateItem, deleteItem } from './api';
import { useAuth } from './context/AuthContext';
import './styles.css'; 

// --- Modal Component ---
// (Put this in the same file for simplicity, or move to its own file)
function InventoryItemModal({ item, onClose, onSubmit, initialError }) {
    // Determine if we are editing (item exists) or adding (item is null)
    const isEditing = item !== null;

    const [formData, setFormData] = useState({
        Product_name: item?.product_name || '',
        case_quantity: item?.case_quantity ?? '', // Use ?? for nullish coalescing
        order_unit: item?.order_unit || '',
        case_price: item?.case_price ?? '',
        current_stock: item?.current_stock ?? '',
        max_quantity: item?.max_quantity ?? '',
        min_quantity: item?.min_quantity ?? '',
        // Format date for input type="date" (YYYY-MM-DD)
        expiration: item?.expiration ? new Date(item.expiration).toISOString().split('T')[0] : '',
        categoryID: item?.categoryID ?? '', // Allow empty string for optional fields
        supplierID: item?.supplierID ?? '',
        // UserID removed
    });
    const [error, setError] = useState(initialError); // Local error state for the modal

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        // Handle number inputs appropriately
        const val = type === 'number' ? (value === '' ? '' : parseFloat(value)) : value;
        // Allow empty strings for optional number fields during input
        const finalValue = (name === 'categoryID' || name === 'supplierID' || name === 'case_quantity' || name === 'case_price' || name === 'current_stock' || name === 'max_quantity' || name === 'min_quantity') && val === '' ? '' : val;

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
        for (const key of ['case_quantity', 'case_price', 'current_stock', 'max_quantity', 'min_quantity', 'categoryID', 'supplierID']) {
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
        <div className="modal-backdrop" onClick={onClose}> {/* Close on backdrop click */}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent backdrop click from closing when clicking inside modal */}
                <h3>{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
                {error && <div className="error-message">{error} <button onClick={() => setError(null)} className="close-button simple">×</button></div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-grid modal-form"> {/* Add modal-form class for specific styling */}
                        <input type="text" placeholder="Product Name *" name="Product_name" value={formData.product_name} onChange={handleChange} required />
                        <input type="number" placeholder="Case Quantity" name="case_quantity" value={formData.case_quantity} onChange={handleChange} min="0" />
                        <input type="text" placeholder="Order Unit" name="order_unit" value={formData.order_unit} onChange={handleChange} />
                        <input type="number" placeholder="Case Price *" name="case_price" value={formData.case_price} onChange={handleChange} step="0.01" min="0" required />
                        <input type="number" placeholder="Current Stock *" name="current_stock" value={formData.current_stock} onChange={handleChange} min="0" required/>
                        <input type="number" placeholder="Max Quantity" name="max_quantity" value={formData.max_quantity} onChange={handleChange} min="0" />
                        <input type="number" placeholder="Min Quantity" name="min_quantity" value={formData.min_quantity} onChange={handleChange} min="0" />
                        <input type="date" placeholder="Expiration Date" name="expiration" value={formData.expiration} onChange={handleChange} />
                        <input type="number" placeholder="Category ID" name="categoryID" value={formData.categoryID} onChange={handleChange} min="1" />
                        <input type="number" placeholder="Supplier ID" name="supplierID" value={formData.supplierID} onChange={handleChange} min="1" />
                        {/* UserID Input Removed */}
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn-primary">{isEditing ? 'Update Item' : 'Add Item'}</button>
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
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
        if (!user) { // Should be handled by ProtectedRoute, but good failsafe
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

    // --- Modal Handlers ---
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
         const primaryKey = 'productID'; // <<<--- CONFIRM YOUR PRIMARY KEY COLUMN NAME
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
        <div className="inventory-container">
            <div className="header">
                {/* Consider moving NavLink to App.js Navigation component */}
                {/* <NavLink to="/" className="nav-link">← Back to Home</NavLink> */}
                <h2>Inventory Management</h2>
                 {/* Show Add button only to admins */}
                 {user?.role === 'admin' && (
                    <button onClick={handleOpenAddModal} className="add-button main-add-btn">
                        + Add New Item
                    </button>
                )}
            </div>

            {/* Display global errors (like fetch errors) */}
            {error && (
                <div className="error-message global-error">
                    {error}
                    <button onClick={() => setError(null)} className="close-button">×</button>
                </div>
            )}

            {/* Product List */}
            <div className="product-list-section">
                {/* Removed "Product List" h3 as it's implied */}
                {/* Display loading indicator subtly during refreshes */}
                 {loading && items.length > 0 && <div className="loading-inline">Refreshing...</div>}

                {items.length === 0 && !loading ? (
                    <p className="no-items">No items in inventory.</p>
                ) : (
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                {/* Add/remove columns as needed */}
                                <th>Stock</th>
                                <th>Price</th>
                                <th>Order Unit</th>
                                <th>Expires</th>
                                {/* Actions column only for admin */}
                                {user?.role === 'admin' && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => {
                                // --- Determine the correct Primary Key ---
                                // Adjust this based on what your API actually returns in the data array
                                const itemKey = item.productID || item.productid || item.id;
                                if (!itemKey) {
                                    console.warn("Item found without a valid key:", item);
                                    return null; // Skip rendering items without a key
                                }
                                // --- ---

                                return (
                                    <tr key={itemKey}>
                                        {/* Use consistent field names matching DB/API */}
                                        <td>{item.product_name}</td>
                                        <td>{item.current_stock ?? 'N/A'}</td>
                                        <td>${item.case_price?.toFixed(2) ?? 'N/A'}</td>
                                        <td>{item.order_unit || 'N/A'}</td>
                                        <td>{item.expiration ? new Date(item.expiration).toLocaleDateString() : 'N/A'}</td>

                                        {/* Show Edit/Delete buttons only to admins */}
                                        {user?.role === 'admin' && (
                                            <td>
                                                <div className="button-group">
                                                    <button
                                                        className="action-btn edit-btn"
                                                        onClick={() => handleOpenEditModal(item)} // Pass the whole item
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="action-btn delete-btn"
                                                        onClick={() => handleDelete(itemKey)} // Pass the primary key value
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
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