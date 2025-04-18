import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInventory, addItem, updateItem, deleteItem } from '../api';
import { useAuth } from '../context/AuthContext';
import InventoryItemModal from './InventoryItemModal';

// --- Main Inventory Component ---
function Inventory() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const fetchInventory = useCallback(async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const data = await getInventory();
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching inventory:', err);
            if (err.response?.status === 401 || err.message.includes('401')) {
                navigate('/login');
            } else {
                setError('Failed to load inventory. Please try again later.');
            }
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [user, navigate]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleOpenAddModal = () => {
        setCurrentItem(null);
        setError(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item) => {
        if (!item || typeof item !== 'object') {
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
        setCurrentItem(null);
        setError(null);
    };

    const handleFormSubmit = async (formData) => {
        const primaryKey = 'productid';
        const isEditing = currentItem && currentItem[primaryKey];

        try {
            setLoading(true);
            if (isEditing) {
                await updateItem(currentItem[primaryKey], formData);
            } else {
                await addItem(formData);
            }
            handleModalClose();
            await fetchInventory();
        } catch (err) {
            console.error(`Error ${isEditing ? 'updating' : 'adding'} item:`, err);
            setError(`Failed to ${isEditing ? 'update' : 'add'} item. ${err.response?.data?.error || ''}`);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const primaryKey = 'productid';
        const itemToDelete = items.find(item => item.productid === id);

        if (!itemToDelete) {
            setError("Item not found.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete "${itemToDelete.product_name || 'this item'}"?`)) {
            try {
                setLoading(true);
                setError(null);
                await deleteItem(id);
                await fetchInventory();
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

    if (loading && items.length === 0) {
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
                            const itemKey = item.productid;
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

            {isModalOpen && (
                <InventoryItemModal
                    item={currentItem}
                    onClose={handleModalClose}
                    onSubmit={handleFormSubmit}
                    initialError={null}
                />
            )}
        </div>
    );
}

export default Inventory;
