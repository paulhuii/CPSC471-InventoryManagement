import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInventory, addItem, updateItem, deleteItem } from '../api';
import { useAuth } from '../context/AuthContext';
import InventoryItemModal from './InventoryItemModal';

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
        const updatedData = { ...formData, [primaryKey]: currentItem[primaryKey] };
        await updateItem(currentItem[primaryKey], updatedData);
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

  const getStockStatus = (stock, minQty) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'bg-[#D99292] text-red-800' };
    if (stock <= minQty) return { text: 'Low Stock', color: 'bg-[#F4D98E] text-yellow-800' };
    return { text: 'In Stock', color: 'bg-[#A3C18F] text-green-800' };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-900">Product List</h2>
        {user?.role === 'admin' && (
          <button onClick={handleOpenAddModal} className="text-black px-4 py-2 rounded shadow" style={{ backgroundColor: '#8DACE5' }}>
            + Add products
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right text-lg font-bold">×</button>
        </div>
      )}

      <div className="overflow-x-auto bg-gray-100 p-4 rounded-lg shadow">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-gray-700">
              <th className="px-4 py-2" style={{ backgroundColor: '#D9BE92' }}>Product</th>
              <th className="px-4 py-2" style={{ backgroundColor: '#D9BE92' }}>Quantity</th>
              <th className="px-4 py-2" style={{ backgroundColor: '#D9BE92' }}>Price</th>
              <th className="px-4 py-2" style={{ backgroundColor: '#D9BE92' }}>Stock Status</th>
              <th className="px-4 py-2" style={{ backgroundColor: '#D9BE92' }}>Supplier</th>
              <th className="px-4 py-2" style={{ backgroundColor: '#D9BE92' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const { text: statusText, color: statusColor } = getStockStatus(item.current_stock, item.min_quantity);
              return (
                <tr key={item.productid} className="border-t">
                  <td className="px-4 py-2">{item.product_name}</td>
                  <td className="px-4 py-2">{item.current_stock}</td>
                  <td className="px-4 py-2">${item.case_price?.toFixed(2)}/{item.order_unit}</td>
                  <td className="px-4 py-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>{statusText}</span>
                  </td>
                  <td className="px-4 py-2">{item.supplier?.supplier_name || 'Unknown'}</td>
                  <td className="px-4 py-2 flex space-x-2">
                    <button onClick={() => handleOpenEditModal(item)} className="text-white text-sm font-semibold px-3 py-1 rounded" style={{ backgroundColor: '#7E82A4' }}>Edit</button>
                    <button onClick={() => handleDelete(item.productid)} className="text-white text-sm font-semibold px-3 py-1 rounded" style={{ backgroundColor: '#D99292' }}>Delete</button>
                  </td>
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
