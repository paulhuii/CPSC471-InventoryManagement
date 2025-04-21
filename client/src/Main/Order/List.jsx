// src/Main/Order/List.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useOrderCart } from "../OrderCartContext";
import {
  getInventory,
  getSuppliers,
  createOrder,
  addOrderDetails,
  updateItem,
  addItem as addProductApi 
} from "../../api";
import InventoryItemModal from '../InventoryItemModal';
import AddItemForm from './AddItemForm';
import SupplierOrderSection from './SupplierOrderSection'; 
import { useStateWithLocalStorage } from '../hooks/useStateWithLocalStorage'; 

// Main component for the Order List creation/management page
const OrderList = () => {
    const { user } = useAuth();
    const { cartItems, clearCart } = useOrderCart();
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [groupedItems, setGroupedItems] = useStateWithLocalStorage("groupedOrderItems", {});
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [editedItem, setEditedItem] = useState(null); 

    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [addProductError, setAddProductError] = useState(null);

    // --- Data Fetching ---
    const fetchProducts = useCallback(async () => {
        try {
            const data = await getInventory();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
        getSuppliers().then(setSuppliers);
    }, [fetchProducts]);

    // --- Process Cart Items ---
    useEffect(() => {
        if (cartItems.length > 0 && suppliers.length > 0) {
            const newGrouped = { ...groupedItems };
            let changed = false;
            cartItems.forEach(ci => {
                const supplierInfo = suppliers.find(s => s.supplierid === ci.supplierid);
                const supplierName = supplierInfo?.supplier_name;
                if (!supplierName) {
                    console.warn(`Supplier not found for ID: ${ci.supplierid} for product ${ci.product_name}`);
                    return;
                }
                if (!newGrouped[supplierName]) newGrouped[supplierName] = [];
                const existingIndex = newGrouped[supplierName].findIndex(item => item.productid === ci.productid);
                if (existingIndex === -1) {
                    newGrouped[supplierName].push({
                        productid: ci.productid,
                        product_name: ci.product_name,
                        quantity: ci.requested_quantity,
                        price: ci.unit_price,
                        order_unit: ci.order_unit || "",
                        supplier_name: supplierName,
                    });
                    changed = true;
                }
            });
            if (changed) setGroupedItems(newGrouped);
            clearCart();
        }
    }, [cartItems, clearCart, groupedItems, setGroupedItems, suppliers]);

    // --- Modal Handlers ---
    const handleOpenAddProductModal = () => {
        setAddProductError(null);
        setIsAddProductModalOpen(true);
    };
    const handleCloseAddProductModal = () => {
        setIsAddProductModalOpen(false);
        setAddProductError(null);
    };
    const handleAddProductSubmit = async (newProductData) => {
        try {
            setAddProductError(null);
            const addedProductArray = await addProductApi(newProductData); // Use renamed import
            if (addedProductArray && addedProductArray.length > 0) {
                handleCloseAddProductModal();
                await fetchProducts();
                alert(`Product "${addedProductArray[0]?.product_name || 'New Product'}" added successfully! You can now select it for your order.`);
            } else {
                throw new Error("Failed to add product, no data returned from server.");
            }
        } catch (err) {
            console.error("Failed to add product from order list:", err);
            setAddProductError(err.response?.data?.error || err.message || "An unexpected error occurred while adding the product.");
        }
    };

    // --- Order Item Handlers ---
    const handleAddItem = (formDataFromForm, resetFormCallback) => {
        const { productid, quantity, price, order_unit, supplier_name } = formDataFromForm;
        if (productid && quantity && price && order_unit && supplier_name) {
            const product = products.find(p => p.productid.toString() === productid);
            if (!product) {
                alert("Selected product details not found. Please refresh or select a valid product.");
                return;
            }
            const newItem = {
                productid: parseInt(productid, 10),
                quantity: parseInt(quantity, 10),
                price: parseFloat(price),
                order_unit: order_unit,
                product_name: product.product_name,
                supplier_name,
            };

            setGroupedItems(prev => {
                const currentSupplierItems = prev[supplier_name] || [];
                const exists = currentSupplierItems.some(item => item.productid === newItem.productid);
                if (exists) {
                    alert(`${newItem.product_name} is already in the order list for ${supplier_name}. You can edit the existing entry.`);
                    return prev;
                }
                return { ...prev, [supplier_name]: [...currentSupplierItems, newItem] };
            });
            resetFormCallback(); // Reset the form in the child component
        } else {
            alert("Please fill in all fields (Product, Quantity, Price, Order Unit, Supplier) to add an item.");
        }
    };

    const handleEditItem = (supplier, index) => {
        setEditingSupplier(supplier);
        setEditingIndex(index);
        const itemToEdit = groupedItems[supplier][index];
        // Set the temporary state for the item being edited
        setEditedItem({
            ...itemToEdit,
            quantity: parseInt(itemToEdit.quantity, 10) || 0,
            price: parseFloat(itemToEdit.price) || 0,
        });
    };

    const handleSaveEdit = () => {
        setGroupedItems(prev => {
            const updatedSupplierItems = [...prev[editingSupplier]];
            // Ensure quantity and price are numbers in the final save
            updatedSupplierItems[editingIndex] = {
                ...editedItem, // Use data from the temporary editedItem state
                quantity: parseInt(editedItem.quantity, 10) || 0,
                price: parseFloat(editedItem.price) || 0,
            };
            return { ...prev, [editingSupplier]: updatedSupplierItems };
        });
        // Reset editing state
        setEditingIndex(null);
        setEditedItem(null);
        setEditingSupplier(null);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditedItem(null);
        setEditingSupplier(null);
    }

    const handleDeleteItem = (supplier, index) => {
        if (window.confirm(`Remove ${groupedItems[supplier][index].product_name} from this order list?`)) {
            setGroupedItems(prev => {
                const updatedSupplierItems = [...prev[supplier]];
                updatedSupplierItems.splice(index, 1);
                if (updatedSupplierItems.length === 0) {
                    const { [supplier]: _, ...rest } = prev;
                    return rest;
                }
                return { ...prev, [supplier]: updatedSupplierItems };
            });
             // If deleting the item currently being edited, cancel editing state
             if (editingSupplier === supplier && editingIndex === index) {
                handleCancelEdit();
             }
        }
    };

    // --- Place Order Handler ---
    const handlePlaceOrderForSupplier = async (supplierName, items) => {
        const supplier = suppliers.find(s => s.supplier_name === supplierName);
        if (!supplier) {
            alert(`Could not find supplier details for ${supplierName}. Order cannot be placed.`);
            return;
        }
        const supplierid = supplier.supplierid;
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const tax = subtotal * 0.05;
        const total_amount = subtotal + tax;

        if (!user || !user.userid) {
            alert("User not identified. Cannot place order."); return;
        }

        try {
            const order = await createOrder({
                order_date: new Date().toISOString().split("T")[0],
                total_amount: total_amount,
                supplierid: supplierid,
                userid: user.userid,
            });
            if (!order || !order.orderid) throw new Error("Failed to create order header.");

            const detailItems = items.map(item => ({
                orderid: order.orderid,
                productid: item.productid,
                supplierid: supplierid,
                unit_price: item.price,
                requested_quantity: item.quantity,
                order_unit: item.order_unit,
            }));
            await addOrderDetails(detailItems);

            // Optional product supplier update (unchanged)
            for (const item of detailItems) {
                const product = products.find(p => p.productid === item.productid);
                if (!product?.supplierid || product?.supplier?.supplier_name === "N/A") {
                  try {
                    await updateItem(item.productid, { supplierid: item.supplierid });
                  } catch (err) { console.warn(`Could not update product ${item.productid} supplier ID:`, err.message); }
                }
            }

            alert(`Order placed successfully for ${supplierName}!`);
            setGroupedItems(prev => {
                const { [supplierName]: _, ...rest } = prev;
                return rest;
            });

        } catch (error) {
            console.error(`Failed to place order for ${supplierName}:`, error);
            alert(`Error placing order for ${supplierName}: ${error.message || 'Unknown error'}`);
        }
    };

    // --- Render ---
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">
                Create New Order - {new Date().toLocaleDateString()}
            </h2>

            {/* Use the AddItemForm component */}
            <AddItemForm
                products={products}
                suppliers={suppliers}
                onAddItem={handleAddItem}
                onOpenAddProductModal={handleOpenAddProductModal}
            />

            {/* Display Grouped Order Items */}
            {Object.keys(groupedItems).length === 0 ? (
                <p className="text-center text-gray-500 italic mt-8">Your order list is empty. Add items using the form above.</p>
            ) : (
                Object.entries(groupedItems).map(([supplier, items]) => (
                    <SupplierOrderSection
                        key={supplier}
                        supplierName={supplier}
                        items={items}
                        userRole={user?.role?.toLowerCase()}
                        editingIndex={editingIndex}
                        editingSupplier={editingSupplier}
                        editedItem={editedItem} // Pass the temporary edit state
                        onEditItem={handleEditItem}
                        onDeleteItem={handleDeleteItem}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onPlaceOrder={handlePlaceOrderForSupplier}
                        onEditedItemChange={setEditedItem} // Pass the setter for child to update
                    />
                ))
            )}

            {/* Add Product Modal */}
            {isAddProductModalOpen && (
                <InventoryItemModal
                    item={null}
                    onClose={handleCloseAddProductModal}
                    onSubmit={handleAddProductSubmit}
                    initialError={addProductError}
                    isQuickAdd={false} 
                />
            )}
        </div>
    );
};

export default OrderList;