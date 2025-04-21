// src/Main/Order/SupplierOrderSection.jsx
import React from 'react';
import OrderItemRow from './OrderItemRow';

const SupplierOrderSection = ({
    supplierName,
    items = [],
    userRole,
    editingIndex,
    editingSupplier,
    editedItem,
    onEditItem,
    onDeleteItem,
    onSaveEdit,
    onCancelEdit,
    onPlaceOrder,
    onEditedItemChange 
}) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    return (
        <div className="mb-8 border border-gray-300 rounded-lg shadow-md bg-white overflow-hidden">
            {/* Supplier Header */}
            <h3 className="text-lg font-semibold mb-0 px-4 py-3 bg-gray-100 border-b border-gray-200 text-gray-800">
                Supplier: {supplierName}
            </h3>

            {/* Table container */}
            <div className="overflow-x-auto p-4">
                <table className="min-w-full mb-4 text-sm">
                    <thead className="bg-gray-50">
                        <tr className="text-left text-gray-600 uppercase text-xs tracking-wider">
                            <th className="px-3 py-2 font-semibold">Product</th>
                            <th className="px-3 py-2 font-semibold text-center">Quantity</th>
                            <th className="px-3 py-2 font-semibold text-center">Price</th>
                            <th className="px-3 py-2 font-semibold text-center">Order Unit</th>
                            <th className="px-3 py-2 font-semibold text-right">Total Cost</th>
                            <th className="px-3 py-2 font-semibold text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {items.map((item, idx) => (
                            <OrderItemRow
                                key={idx}
                                item={item}
                                index={idx}
                                supplierName={supplierName}
                                isEditing={editingIndex === idx && editingSupplier === supplierName}
                                editedItemData={editedItem} // Pass the data for the item being edited
                                onEditClick={onEditItem}
                                onSaveClick={onSaveEdit}
                                onCancelClick={onCancelEdit}
                                onDeleteClick={onDeleteItem}
                                onEditDataChange={onEditedItemChange} // Pass the handler down
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="px-4 pb-4 text-right text-sm space-y-1">
                <p className="text-gray-600">Subtotal: <span className="font-medium text-gray-800">${subtotal.toFixed(2)}</span></p>
                <p className="text-gray-600">Tax (5%): <span className="font-medium text-gray-800">${tax.toFixed(2)}</span></p>
                <p className="font-bold text-base border-t border-gray-200 pt-2 mt-2 text-gray-900">Order Total: ${total.toFixed(2)}</p>
            </div>

            {/* Place Order Button (Admin only) */}
            {userRole === "admin" ? (
                <div className="px-4 pb-4 text-right border-t border-gray-200 pt-3">
                    <button
                        className="bg-[#61759B] text-white px-5 py-2 rounded shadow-sm hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50"
                        onClick={() => onPlaceOrder(supplierName, items)}
                        disabled={items.length === 0}
                    >
                        Place Order for {supplierName}
                    </button>
                </div>
            ) : (
                <p className="italic text-xs text-gray-500 text-right px-4 pb-3 border-t border-gray-200 pt-3">
                    Only administrators can place orders.
                </p>
            )}
        </div>
    );
};

export default SupplierOrderSection;