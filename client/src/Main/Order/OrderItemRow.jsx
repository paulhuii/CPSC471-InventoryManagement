// src/Main/Order/OrderItemRow.jsx
import React from 'react';

const OrderItemRow = ({
    item,
    index,
    supplierName,
    isEditing,
    editedItemData, // Data for the item being edited
    onEditClick,
    onSaveClick,
    onCancelClick,
    onDeleteClick,
    onEditDataChange // Function to update the parent's editedItem state
}) => {

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let parsedValue = value; // Default to string value

        // Handle numeric types specifically
        if (name === 'quantity') {
            // Allow empty string for temporary state, parse to int otherwise, default to 0
            parsedValue = value === '' ? '' : (parseInt(value, 10) || 0);
        } else if (name === 'price') {
            // Allow empty string/decimal point, parse to float otherwise, default to 0
             parsedValue = value === '' ? '' : (parseFloat(value) || 0);
        }
        // For 'order_unit', parsedValue remains the string 'value'

        // Update the parent's state (editedItem)
        onEditDataChange({ ...editedItemData, [name]: parsedValue });
    };

    return (
        <tr className="hover:bg-gray-50">
            {/* Product Name (Not editable here) */}
            <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{item.product_name}</td>

            {/* Quantity (Editable) */}
            <td className="px-3 py-2 text-center">
                {isEditing ? (
                    <input
                        type="number"
                        name="quantity" // Name matches state key
                        value={editedItemData?.quantity ?? ''} // Use edited data, fallback
                        onChange={handleInputChange}
                        className="border border-gray-300 rounded px-2 py-1 w-20 text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        min="0" // Allow 0 quantity if needed
                    />
                ) : item.quantity}
            </td>

            {/* Price (Editable) */}
            <td className="px-3 py-2 text-center">
                {isEditing ? (
                    <input
                        type="number"
                        name="price" // Name matches state key
                        step="0.01"
                        value={editedItemData?.price ?? ''} // Use edited data, fallback
                        onChange={handleInputChange}
                        className="border border-gray-300 rounded px-2 py-1 w-24 text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        min="0.00"
                        placeholder="0.00"
                    />
                ) : `$${parseFloat(item.price).toFixed(2)}`}
            </td>

            {/* Order Unit (NOW Editable) */}
            <td className="px-3 py-2 text-center">
                {isEditing ? (
                    <input
                        type="text"
                        name="order_unit" // Name matches state key
                        value={editedItemData?.order_unit ?? ''} // Use edited data, fallback
                        onChange={handleInputChange} // Generic handler works for text
                        className="border border-gray-300 rounded px-2 py-1 w-24 text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., case"
                    />
                ) : (item.order_unit || 'N/A')} {/* Display N/A if empty */}
            </td>

            {/* Line Total (Calculated, not editable) */}
            <td className="px-3 py-2 font-medium text-right">
                {/* Use edited values if editing for live calculation */}
                {isEditing
                    ? `$${(Number(editedItemData?.quantity || 0) * Number(editedItemData?.price || 0)).toFixed(2)}`
                    : `$${(Number(item.quantity) * Number(item.price)).toFixed(2)}`
                }
            </td>

            {/* Action Buttons */}
            <td className="px-3 py-2 space-x-2 whitespace-nowrap text-center">
                {isEditing ? (
                    <>
                        <button onClick={onSaveClick} className="bg-[#52604A] text-white px-3 py-1 rounded text-xs hover:bg-green-800 focus:outline-none focus:ring-1 focus:ring-green-500">Save</button>
                        <button onClick={onCancelClick} className="bg-gray-400 text-white px-3 py-1 rounded text-xs hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400">Cancel</button>
                    </>
                ) : (
                    <button onClick={() => onEditClick(supplierName, index)} className="bg-[#7E82A4] text-white px-3 py-1 rounded text-xs hover:bg-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500">Edit</button>
                )}
                {/* Delete button always visible */}
                <button onClick={() => onDeleteClick(supplierName, index)} className="bg-[#D99292] text-black px-3 py-1 rounded text-xs hover:bg-red-400 focus:outline-none focus:ring-1 focus:ring-red-500">Delete</button>
            </td>
        </tr>
    );
};

export default OrderItemRow;