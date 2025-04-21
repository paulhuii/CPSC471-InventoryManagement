// src/Main/Order/AddSupplierModal.jsx
import React, { useState, useEffect } from 'react';

const AddSupplierModal = ({
    isOpen,
    onClose,
    onSubmit,
    initialSupplierName = '', // This will now act as a default value
    initialError = null
}) => {
    // Initialize formData with the name passed in, allowing it to be changed
    const [formData, setFormData] = useState({
        supplier_name: initialSupplierName,
        contact: '',
        email: '',
        address: ''
    });
    const [error, setError] = useState(initialError);

    // Reset form (including the name) if the modal is reopened with a different initial name
    useEffect(() => {
        setFormData({
            supplier_name: initialSupplierName,
            contact: '',
            email: '',
            address: ''
        });
    }, [initialSupplierName, isOpen]); // Reset when initial name or visibility changes

    // Update local error state if the initialError prop changes
    useEffect(() => {
        setError(initialError);
    }, [initialError]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError(null); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic Validation (name is now user-editable, so validate it)
        if (!formData.supplier_name || !formData.contact || !formData.email || !formData.address) {
            setError("All fields are required.");
            return;
        }

        // Optional: Add more specific validation (e.g., email format) here if desired

        try {
            // Call the onSubmit prop passed from OrderList with the current formData
            await onSubmit(formData);
            // OrderList's onSubmit should handle closing the modal on success
        } catch (err) {
            console.error("AddSupplierModal handleSubmit caught error:", err);
            setError(err.message || "Failed to submit supplier.");
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4 space-y-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-xl font-semibold text-gray-800">Add New Supplier</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold" aria-label="Close modal">×</button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm">
                        {error}
                         <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-3 py-1 text-red-500 hover:text-red-700 font-bold" aria-label="Dismiss error">×</button>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                        <input
                            id="supplier_name"
                            name="supplier_name"
                            type="text"
                            required
                            value={formData.supplier_name}
                            onChange={handleChange} // Allow changes
                            placeholder="Enter the supplier's name"
                            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            // REMOVED readOnly attribute
                        />
                        {/* REMOVED the paragraph saying the name cannot be changed */}
                    </div>
                    <div>
                        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">Contact Person/Phone *</label>
                        <input
                            id="contact" name="contact" type="text" required
                            value={formData.contact} onChange={handleChange} placeholder="e.g., John Doe - 555-1234"
                            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                         />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            id="email" name="email" type="email" required
                            value={formData.email} onChange={handleChange} placeholder="e.g., contact@supplier.com"
                            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                         />
                    </div>
                     <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                        <textarea
                            id="address" name="address" required rows="2"
                            value={formData.address} onChange={handleChange} placeholder="e.g., 123 Supplier St, City, ST 12345"
                            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                         />
                    </div>

                     {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 mt-2 border-t">
                        <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">Cancel</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">Add Supplier</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSupplierModal;