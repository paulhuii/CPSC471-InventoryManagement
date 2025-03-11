import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    getInventory,
    addItem,
    updateItem,
    deleteItem,
} from './api';
import { useAuth } from './context/AuthContext';

function Inventory() {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({
        Product_name: '',
        case_quantity: '',
        order_unit: '',
        case_price: '',
        current_stock: '',
        max_quantity: '',
        min_quantity: '',
        expiration: '',
        categoryID: '',
        supplierID: '',
        UserID: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchInventory();
    }, [user, navigate]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getInventory();
            console.log('Received inventory data:', data);
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching inventory:', err);
            if (err.response?.status === 401) {
                navigate('/login');
            } else {
                setError('Failed to load inventory. Please try again later.');
            }
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        try {
            // Validate required fields
            if (
                !newItem.Product_name ||
                !newItem.case_quantity ||
                !newItem.order_unit ||
                !newItem.case_price ||
                !newItem.current_stock ||
                !newItem.max_quantity ||
                !newItem.min_quantity ||
                !newItem.expiration ||
                !newItem.categoryID ||
                !newItem.supplierID ||
                !newItem.UserID
            ) {
                setError('Please fill in all fields');
                return;
            }

            await addItem(newItem);
            setNewItem({
                Product_name: '',
                case_quantity: '',
                order_unit: '',
                case_price: '',
                current_stock: '',
                max_quantity: '',
                min_quantity: '',
                expiration: '',
                categoryID: '',
                supplierID: '',
                UserID: ''
            });
            setError(null);
            fetchInventory();
        } catch (err) {
            console.error('Error adding item:', err);
            setError('Failed to add item');
            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleUpdate = async (id) => {
        try {
            const itemToUpdate = items.find((item) => item.productID === id);
            await updateItem(id, itemToUpdate);
            setError(null);
            fetchInventory();
        } catch (err) {
            console.error('Error updating item:', err);
            setError('Failed to update item');
            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteItem(id);
            setError(null);
            fetchInventory();
        } catch (err) {
            console.error('Error deleting item:', err);
            setError('Failed to delete item');
            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="inventory-container">
            <div className="header">
                <NavLink to="/" className="nav-link">← Back to Home</NavLink>
                <h2>Inventory Management</h2>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)} className="close-button">×</button>
                </div>
            )}

            {/* Add Product Form */}
            <div className="add-product-section">
                <h3>Add New Product</h3>
                <div className="form-grid">
                    <input
                        type="text"
                        placeholder="Product Name"
                        value={newItem.Product_name}
                        onChange={(e) => setNewItem({ ...newItem, Product_name: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Case Quantity"
                        value={newItem.case_quantity}
                        onChange={(e) => setNewItem({ ...newItem, case_quantity: e.target.value })}
                        min="0"
                    />
                    <input
                        type="text"
                        placeholder="Order Unit"
                        value={newItem.order_unit}
                        onChange={(e) => setNewItem({ ...newItem, order_unit: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Case Price"
                        value={newItem.case_price}
                        onChange={(e) => setNewItem({ ...newItem, case_price: e.target.value })}
                        step="0.01"
                        min="0"
                    />
                    <input
                        type="number"
                        placeholder="Current Stock"
                        value={newItem.current_stock}
                        onChange={(e) => setNewItem({ ...newItem, current_stock: e.target.value })}
                        min="0"
                    />
                    <input
                        type="number"
                        placeholder="Max Quantity"
                        value={newItem.max_quantity}
                        onChange={(e) => setNewItem({ ...newItem, max_quantity: e.target.value })}
                        min="0"
                    />
                    <input
                        type="number"
                        placeholder="Min Quantity"
                        value={newItem.min_quantity}
                        onChange={(e) => setNewItem({ ...newItem, min_quantity: e.target.value })}
                        min="0"
                    />
                    <input
                        type="date"
                        placeholder="Expiration Date"
                        value={newItem.expiration}
                        onChange={(e) => setNewItem({ ...newItem, expiration: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Category ID"
                        value={newItem.categoryID}
                        onChange={(e) => setNewItem({ ...newItem, categoryID: e.target.value })}
                        min="1"
                    />
                    <input
                        type="number"
                        placeholder="Supplier ID"
                        value={newItem.supplierID}
                        onChange={(e) => setNewItem({ ...newItem, supplierID: e.target.value })}
                        min="1"
                    />
                    <input
                        type="number"
                        placeholder="User ID"
                        value={newItem.UserID}
                        onChange={(e) => setNewItem({ ...newItem, UserID: e.target.value })}
                        min="1"
                    />
                    <button onClick={handleAdd} className="add-button">Add Item</button>
                </div>
            </div>

            {/* Product List */}
            <div className="product-list-section">
                <h3>Product List</h3>
                {items.length === 0 ? (
                    <p className="no-items">No items in inventory</p>
                ) : (
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Case Qty</th>
                                <th>Order Unit</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Max</th>
                                <th>Min</th>
                                <th>Expires</th>
                                <th>Category</th>
                                <th>Supplier</th>
                                <th>User</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.productid}>
                                    <td>{item.product_name}</td>
                                    <td>{item.case_quantity}</td>
                                    <td>{item.order_unit}</td>
                                    <td>${item.case_price}</td>
                                    <td>{item.current_stock}</td>
                                    <td>{item.max_quantity}</td>
                                    <td>{item.min_quantity}</td>
                                    <td>{item.expiration}</td>
                                    <td>{item.categoryid}</td>
                                    <td>{item.supplierid}</td>
                                    <td>{item.userid}</td>
                                    <td>
                                        <div className="button-group">
                                            <button
                                                className="update-btn"
                                                onClick={() => handleUpdate(item.productID)}
                                            >
                                                Update
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(item.productID)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Inventory;