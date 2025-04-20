import React, { useState, useEffect } from 'react';

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
        <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
            aria-label="Close modal"
        >
            ×
        </button>
        {children}
        </div>
    </div>
    );

function FilterModal({
    isOpen,
    onClose,
    onApplyFilters,
    initialFilters,
    availableSuppliers = [],
    availableStatuses = [],
    }) {
    const [selectedSuppliers, setSelectedSuppliers] = useState(initialFilters.suppliers || []);
    const [selectedStatuses, setSelectedStatuses] = useState(initialFilters.statuses || []);

    useEffect(() => {
        setSelectedSuppliers(initialFilters.suppliers || []);
        setSelectedStatuses(initialFilters.statuses || []);
    }, [initialFilters]);

    const handleSupplierChange = (supplier) => {
        setSelectedSuppliers(prev =>
        prev.includes(supplier)
            ? prev.filter(s => s !== supplier)
            : [...prev, supplier]
        );
    };

    const handleStatusChange = (status) => {
        setSelectedStatuses(prev =>
        prev.includes(status)
            ? prev.filter(s => s !== status)
            : [...prev, status]
        );
    };

    const handleApply = () => {
        onApplyFilters({
        suppliers: selectedSuppliers,
        statuses: selectedStatuses,
        });
    };

    const handleReset = () => {
        setSelectedSuppliers([]);
        setSelectedStatuses([]);
    }

    if (!isOpen) return null;

    return (
        <Modal onClose={onClose}>
        <h2 className="text-xl font-semibold mb-4">Filter Inventory</h2>

        <div className="mb-4">
            <h3 className="font-medium mb-2">Supplier</h3>
            <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
            {availableSuppliers.length > 0 ? availableSuppliers.map(supplier => (
                <label key={supplier} className="flex items-center space-x-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={selectedSuppliers.includes(supplier)}
                    onChange={() => handleSupplierChange(supplier)}
                    className="rounded"
                />
                <span>{supplier}</span>
                </label>
            )) : <p className="text-gray-500 text-sm">No suppliers found</p>}
            </div>
        </div>

        <div className="mb-6">
            <h3 className="font-medium mb-2">Stock Status</h3>
            <div className="space-y-1">
            {availableStatuses.map(status => (
                <label key={status} className="flex items-center space-x-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => handleStatusChange(status)}
                    className="rounded"
                />
                <span>{status}</span>
                </label>
            ))}
            </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
            <button
            onClick={handleReset}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
            >
            Reset Filters
            </button>
            <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
            >
            Cancel
            </button>
            <button
            onClick={handleApply}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
            Apply Filters
            </button>
        </div>
        </Modal>
    );
}

export default FilterModal;