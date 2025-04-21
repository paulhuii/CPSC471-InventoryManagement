// client/src/Main/InventoryItemModal.jsx
import React, { useState, useEffect } from "react";

function InventoryItemModal({
  item,       // Item object if editing, null if adding (though adding isn't triggered from Inventory view anymore)
  onClose,
  onSubmit,   // Function to call with submitted data
  initialError,
}) {

  const isEditing = item !== null;

  // --- Initial form state - include current_stock ---
  const [formData, setFormData] = useState({
    product_name: item?.product_name || "",
    current_stock: item?.current_stock ?? "", // <-- Add current_stock
    min_quantity: item?.min_quantity ?? "",
    max_quantity: item?.max_quantity ?? "",
    expiration: item?.expiration
      ? new Date(item.expiration).toISOString().split("T")[0]
      : "",
    categoryid: item?.categoryid ?? "",
  });

  const [error, setError] = useState(initialError);

  // Update error state if the initialError prop changes
  useEffect(() => {
    setError(initialError);
  }, [initialError]);

   // Reset form data if the item prop changes 
   useEffect(() => {
    if (item) {
        setFormData({
            product_name: item.product_name || "",
            current_stock: item.current_stock ?? "", // Reset with new item's stock
            min_quantity: item.min_quantity ?? "",
            max_quantity: item.max_quantity ?? "",
            expiration: item.expiration ? new Date(item.expiration).toISOString().split("T")[0] : "",
            categoryid: item.categoryid ?? "",
        });
        setError(null); // Clear errors when opening for a new item
    }
    // Only run when the item prop itself changes
   }, [item]);


  // Handle input changes for controlled components
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Allow empty string for numbers during typing, otherwise parse
    const val = type === "number" ? (value === "" ? "" : parseFloat(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    setError(null); // Clear error on change
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // --- Field Validations ---
    if (!formData.product_name) {
      setError("Product Name is required."); return;
    }
    // Validate Current Stock (required, non-negative)
    if (formData.current_stock === "" || formData.current_stock === null || isNaN(formData.current_stock) || parseFloat(formData.current_stock) < 0) {
         setError("Current Stock is required and cannot be negative."); return;
    }
    // Validate Min Quantity (required, non-negative)
    if (formData.min_quantity === "" || formData.min_quantity === null || isNaN(formData.min_quantity) || parseFloat(formData.min_quantity) < 0) {
        setError("Minimum Quantity is required and cannot be negative."); return;
    }
    // Validate Max Quantity (must be >= min quantity if provided)
     if (formData.max_quantity !== null && formData.max_quantity !== "" && (isNaN(formData.max_quantity) || parseFloat(formData.max_quantity) < 0)) {
         setError("Max Quantity must be a non-negative number if provided."); return;
     }
     if (formData.max_quantity !== null && formData.max_quantity !== "" && parseFloat(formData.max_quantity) < parseFloat(formData.min_quantity)) {
        setError("Max Quantity cannot be less than Min Quantity."); return;
     }
     // Validate Category ID (must be number if provided)
     if (formData.categoryid !== null && formData.categoryid !== "" && isNaN(formData.categoryid)) {
         setError("Category ID must be a number if provided."); return;
     }


    // --- Prepare Data to Submit ---
    // Ensure numbers are parsed correctly, handle nulls for optional fields
    const dataToSubmit = {
      product_name: formData.product_name,
      current_stock: parseFloat(formData.current_stock), // <-- Ensure it's a number
      min_quantity: parseFloat(formData.min_quantity),   // <-- Ensure it's a number
      max_quantity: formData.max_quantity === "" || formData.max_quantity === null ? null : parseFloat(formData.max_quantity),
      expiration: formData.expiration === "" ? null : formData.expiration,
      categoryid: formData.categoryid === "" || formData.categoryid === null ? null : parseInt(formData.categoryid, 10),
    };

    console.log("Data being submitted (edit):", dataToSubmit);

    try {
      // onSubmit is the handleFormSubmit function passed from Inventory.jsx
      await onSubmit(dataToSubmit);
      // Parent should close modal on success
    } catch (err) {
      // If onSubmit throws, catch it here and display in the modal
      setError(err.response?.data?.error || err.message || "Submission failed.");
      console.error("Modal Submit Prop Error:", err);
    }
  };

  // --- Define the fields to display in the modal ---
  const fields = [
    { label: "Product Name *", name: "product_name", type: "text", required: true },
    { label: "Current Stock *", name: "current_stock", type: "number", required: true, min: "0" }, // <-- Add field definition
    { label: "Min Quantity *", name: "min_quantity", type: "number", required: true, min: "0" },
    { label: "Max Quantity", name: "max_quantity", type: "number", required: false, min: "0" },
    { label: "Category ID", name: "categoryid", type: "number", required: false }, // Consider making this a select if you have categories
    { label: "Expiration Date", name: "expiration", type: "date", required: false },
  ];

  if (!isEditing) {
      console.warn("InventoryItemModal rendered without an item for editing.");
      return null; // Or display an error/message
  }


  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose} // Allow closing by clicking backdrop
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4 space-y-4 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-xl font-semibold text-gray-800">
             Edit Product Details {/* Modal title always edit in this context */}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold" aria-label="Close modal">×</button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm">
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-3 py-1 text-red-500 hover:text-red-700 font-bold" aria-label="Dismiss error">×</button>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3"
          noValidate // Use manual validation display
        >
          {/* Render fields dynamically */}
          {fields.map(({ label, name, type, required, placeholder, step, min }) => (
        
            <div key={name} className={name === 'product_name' ? 'md:col-span-2' : ''}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                id={name}
                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:text-gray-500"
                placeholder={placeholder || label.replace(" *", "")}
                name={name}
                type={type}
                value={formData[name]} 
                onChange={handleChange}
                required={required} 
                step={step} 
                min={min}   
               
              />
            </div>
          ))}

          {/* Action Buttons */}
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 mt-2 border-t">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
               Update Details {/* Button label always update */}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryItemModal;