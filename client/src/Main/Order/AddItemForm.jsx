// src/Main/Order/AddItemForm.jsx
import React, { useState, useEffect } from 'react';

const AddItemForm = ({
    products = [],
    suppliers = [],
    onAddItem,
    onOpenAddProductModal,
    onOpenAddSupplierModal
}) => {
    // Keep formData structure, productid will be derived
    const [formData, setFormData] = useState({
        productid: "",
        quantity: "",
        price: "",
        order_unit: "",
        supplier_name: "",
    });

    // Add state to hold the value typed/selected in the product input field
    const [productInputName, setProductInputName] = useState("");

    // Effect to clear product input name when productid is reset (e.g., after submission)
    useEffect(() => {
        if (formData.productid === "") {
            setProductInputName("");
        }
        // Find product name if productid is set initially (e.g., if editing was implemented)
        else {
            const product = products.find(p => p.productid === formData.productid);
            if (product && productInputName !== product.product_name) {
                setProductInputName(product.product_name);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.productid]); // Only re-run when productid changes in formData

    // --- Generic Input Handler for most fields ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Special Handler for the Product Input ---
    const handleProductInputChange = (e) => {
        const typedName = e.target.value;
        setProductInputName(typedName); // Update the visible input value

        // Try to find the corresponding product ID based on the name
        const matchedProduct = products.find(
            p => p.product_name.toLowerCase() === typedName.toLowerCase()
        );

        // Update the actual productid in formData if a match is found, otherwise clear it
        setFormData(prev => ({
            ...prev,
            productid: matchedProduct ? matchedProduct.productid : ""
        }));
    };

    // --- Form Submission ---
    const handleSubmit = (e) => {
        e.preventDefault();
        // Pass the formData (which includes the derived productid)
        onAddItem(formData, () => {
            // Reset form state, including the product input name
            setFormData({ productid: "", quantity: "", price: "", order_unit: "", supplier_name: "" });
            setProductInputName(""); // Explicitly clear the product name input state
        });
    };

    // --- Handler for the '+' supplier button ---
    const handleAddSupplierClick = () => {
        onOpenAddSupplierModal(formData.supplier_name);
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 p-4 border rounded bg-white shadow-sm items-end">
            {/* Product Selection (Input + Datalist) */}
            <div className="flex flex-col col-span-1 lg:col-span-1">
                <label htmlFor="product-input" className="text-xs font-medium text-gray-600 mb-1">Product</label>
                <div className="flex items-center gap-2">
                    <input
                        id="product-input"
                        type="text"
                        name="productInputName" // Descriptive name for the input element itself
                        list="product-options" // Link to the datalist
                        value={productInputName} // Bind to the dedicated state variable
                        onChange={handleProductInputChange} // Use the specific handler
                        placeholder="Select or type product..."
                        className="border border-gray-300 rounded px-3 py-2 w-full text-sm flex-grow focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="off" // Good practice for datalist inputs
                    />
                    {/* Datalist provides suggestions */}
                    <datalist id="product-options">
                        {products.sort((a, b) => a.product_name.localeCompare(b.product_name)).map(p => (
                            // The value here MUST be the product name for matching/display
                            <option key={p.productid} value={p.product_name} />
                        ))}
                    </datalist>
                    {/* Add New Product Button */}
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
                    onChange={handleInputChange} // Use generic handler
                    placeholder="e.g., 10" className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" min="1" />
            </div>
            {/* Price Input */}
            <div className="col-span-1">
                <label htmlFor="price-input" className="text-xs font-medium text-gray-600 mb-1">Price per Unit ($)</label>
                <input id="price-input" type="number" step="0.01" name="price" value={formData.price}
                    onChange={handleInputChange} // Use generic handler
                    placeholder="e.g., 15.50" className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" min="0.01" />
            </div>
            {/* Order Unit Input */}
            <div className="col-span-1">
                <label htmlFor="unit-input" className="text-xs font-medium text-gray-600 mb-1">Order Unit</label>
                <input
                    id="unit-input"
                    name="order_unit"
                    value={formData.order_unit}
                    onChange={handleInputChange} // Use generic handler
                    placeholder="e.g. case, box, lbs"
                    className="border border-gray-300 rounded px-3 py-2 w-full text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Supplier Input with Add Button */}
            <div className="flex flex-col col-span-1">
                <label htmlFor="supplier-input" className="text-xs font-medium text-gray-600 mb-1">Supplier Name</label>
                <div className="flex items-center gap-2">
                    <input
                        id="supplier-input"
                        name="supplier_name"
                        list="supplier-options"
                        value={formData.supplier_name}
                        onChange={handleInputChange} // Use generic handler
                        placeholder="Select or type..."
                        className="border border-gray-300 rounded px-3 py-2 w-full text-sm flex-grow focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        autoComplete="off"
                    />
                    <datalist id="supplier-options">
                        {suppliers.sort((a, b) => a.supplier_name.localeCompare(b.supplier_name)).map(s => <option key={s.supplierid} value={s.supplier_name} />)}
                    </datalist>
                    {/* Add New Supplier Button */}
                    <button
                        type="button"
                        onClick={handleAddSupplierClick}
                        className="p-2 border border-gray-300 rounded bg-green-50 hover:bg-green-100 text-green-600 shrink-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                        title="Add New Supplier"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                </div>
            </div>


            {/* Add Item Button */}
            <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1 flex justify-start items-end">
                <button
                    className="bg-[#EADBA0] text-black rounded px-6 py-2 shadow hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 w-full sm:w-auto"
                    onClick={handleSubmit} // Use onClick for button
                >
                    Add Item
                </button>
            </div>
        </div>
    );
};

export default AddItemForm;