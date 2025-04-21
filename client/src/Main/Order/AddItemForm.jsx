// src/Main/Order/AddItemForm.jsx
import React, { useState } from 'react';

const AddItemForm = ({ products = [], suppliers = [], onAddItem, onOpenAddProductModal }) => {
    const [formData, setFormData] = useState({
        productid: "",
        quantity: "",
        price: "",
        order_unit: "",
        supplier_name: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission if wrapped in <form>
        onAddItem(formData, () => {
            // Reset form upon successful add (callback from parent)
            setFormData({ productid: "", quantity: "", price: "", order_unit: "", supplier_name: "" });
        });
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 p-4 border rounded bg-white shadow-sm">
            {/* Product Selection with Add Button */}
            <div className="flex flex-col col-span-1 lg:col-span-1">
                <label htmlFor="product-select" className="text-xs font-medium text-gray-600 mb-1">Product</label>
                <div className="flex items-center gap-2">
                    <select
                        id="product-select"
                        name="productid"
                        value={formData.productid}
                        onChange={handleInputChange}
                        className="border border-gray-300 rounded px-3 py-2 w-full text-sm flex-grow focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">-- Select Product --</option>
                        {products.sort((a, b) => a.product_name.localeCompare(b.product_name)).map(p => (
                            <option key={p.productid} value={p.productid}>{p.product_name}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={onOpenAddProductModal}
                        className="p-2 border border-gray-300 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 shrink-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        title="Add New Product to Inventory"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Quantity Input */}
            <div className="col-span-1">
                <label htmlFor="quantity-input" className="text-xs font-medium text-gray-600 mb-1">Quantity</label>
                <input id="quantity-input" type="number" name="quantity" value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="e.g., 10" className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" min="1" />
            </div>
            {/* Price Input */}
            <div className="col-span-1">
                <label htmlFor="price-input" className="text-xs font-medium text-gray-600 mb-1">Price per Unit ($)</label>
                <input id="price-input" type="number" step="0.01" name="price" value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g., 15.50" className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" min="0.01" />
            </div>
            {/* Order Unit Input */}
            <div className="col-span-1">
                <label htmlFor="unit-input" className="text-xs font-medium text-gray-600 mb-1">Order Unit</label>
                <input
                    id="unit-input"
                    name="order_unit"
                    value={formData.order_unit}
                    onChange={handleInputChange}
                    placeholder="e.g. case, box, lbs"
                    className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            {/* Supplier Input */}
            <div className="flex flex-col col-span-1">
                <label htmlFor="supplier-input" className="text-xs font-medium text-gray-600 mb-1">Supplier Name</label>
                <input id="supplier-input" name="supplier_name" list="supplier-options" value={formData.supplier_name}
                    onChange={handleInputChange}
                    placeholder="Start typing..." className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                <datalist id="supplier-options">
                    {suppliers.sort((a, b) => a.supplier_name.localeCompare(b.supplier_name)).map(s => <option key={s.supplierid} value={s.supplier_name} />)}
                </datalist>
            </div>

            {/* Add Item Button */}
            <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-5 flex justify-end mt-2">
                <button
                    className="bg-[#EADBA0] text-black rounded px-6 py-2 shadow hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    onClick={handleSubmit} // Use onClick for button, or onSubmit if wrapped in <form>
                >
                    Add Item to Order List
                </button>
            </div>
        </div>
    );
};

export default AddItemForm;