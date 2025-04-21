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
        let parsedValue = value;
        if (name === 'quantity') {
            parsedValue = parseInt(value, 10) || 0;
        } else if (name === 'price') {
            parsedValue = parseFloat(value) || 0;
        }
        onEditDataChange({ ...editedItemData, [name]: parsedValue });
    };

    return (
        <tr className="hover:bg-gray-50">
            {/* Product Name */}
            <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{item.product_name}</td>

            {/* Quantity (Editable) */}
            <td className="px-3 py-2 text-center">
                {isEditing ? (
                    <input
                        type="number"
                        name="quantity" // Added name attribute
                        value={editedItemData.quantity}
                        onChange={handleInputChange}
                        className="border border-gray-300 rounded px-2 py-1 w-20 text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                    />
                ) : item.quantity}
            </td>

            {/* Price (Editable) */}
            <td className="px-3 py-2 text-center">
                {isEditing ? (
                    <input
                        type="number"
                        name="price" // Added name attribute
                        step="0.01"
                        value={editedItemData.price}
                        onChange={handleInputChange}
                        className="border border-gray-300 rounded px-2 py-1 w-24 text-sm text-center focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        min="0.01"
                    />
                ) : `$${parseFloat(item.price).toFixed(2)}`}
            </td>

            {/* Order Unit */}
            <td className="px-3 py-2 text-center">{item.order_unit || 'N/A'}</td>

            {/* Line Total */}
            <td className="px-3 py-2 font-medium text-right">
                ${(item.quantity * item.price).toFixed(2)}
            </td>

            {/* Action Buttons */}
            <td className="px-3 py-2 space-x-2 whitespace-nowrap text-center">
                {isEditing ? (
                    <>
                        <button onClick={onSaveClick} className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 focus:outline-none focus:ring-1 focus:ring-green-500">Save</button>
                        <button onClick={onCancelClick} className="bg-gray-400 text-white px-3 py-1 rounded text-xs hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400">Cancel</button>
                    </>
                ) : (
                    <button onClick={() => onEditClick(supplierName, index)} className="bg-[#7E82A4] text-white px-3 py-1 rounded text-xs hover:bg-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500">Edit</button>
                )}
                <button onClick={() => onDeleteClick(supplierName, index)} className="bg-[#D99292] text-black px-3 py-1 rounded text-xs hover:bg-red-400 focus:outline-none focus:ring-1 focus:ring-red-500">Delete</button>
            </td>
        </tr>
    );
};

export default OrderItemRow;