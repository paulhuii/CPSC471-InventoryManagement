// client/src/Main/InventoryItemModal.jsx
import React, { useState, useEffect } from "react";

function InventoryItemModal({
  item,       
  onSubmit,   // Function to call with submitted data
  initialError,
}) {

  const isEditing = item !== null;

  const [formData, setFormData] = useState({
    product_name: item?.product_name || "",
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

  // Handle input changes for controlled components
  const handleChange = (e) => {
    const { name, value, type } = e.target;
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
    if (formData.min_quantity === "" || formData.min_quantity === null || isNaN(formData.min_quantity)) {
        setError("Minimum Quantity is required."); return;
    }
     if (formData.max_quantity !== null && formData.max_quantity !== "" && parseFloat(formData.max_quantity) < parseFloat(formData.min_quantity)) {
        setError("Max Quantity cannot be less than Min Quantity."); return;
     }

    // --- Prepare Data to Submit ---
    const dataToSubmit = {
      product_name: formData.product_name,
      min_quantity: formData.min_quantity === "" ? null : parseFloat(formData.min_quantity),
      max_quantity: formData.max_quantity === "" ? null : parseFloat(formData.max_quantity),
      expiration: formData.expiration === "" ? null : formData.expiration,
      categoryid: formData.categoryid === "" ? null : parseInt(formData.categoryid, 10),
    };

    // If ADDING a new product, explicitly set current_stock to 0
    // Other fields like price, unit, supplier will rely on backend defaults/null handling
    if (!isEditing) {
      dataToSubmit.current_stock = 0;
    }

    console.log("Data being submitted:", dataToSubmit); 

    try {
      await onSubmit(dataToSubmit); // Call the parent component's submit handler
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Submission failed.");
      console.error("Modal Submit Prop Error:", err);
    }
  };

  const fields = [
    { label: "Product Name *", name: "product_name", type: "text", required: true },
    { label: "Min Quantity *", name: "min_quantity", type: "number", required: true },
    { label: "Max Quantity", name: "max_quantity", type: "number", required: false },
    { label: "Category ID", name: "categoryid", type: "number", required: false },
    { label: "Expiration Date", name: "expiration", type: "date", required: false },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 m-4 space-y-4 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? "Edit Product Details" : "Add New Product"}
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
          noValidate
        >
          {/* Render only the defined fields */}
          {fields.map(({ label, name, type, required, placeholder, step, min }) => (
            <div key={name} className={name === 'product_name' ? 'md:col-span-2' : ''}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                id={name}
                className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder={placeholder || label.replace(" *", "")}
                name={name}
                type={type}
                value={formData[name]}
                onChange={handleChange}
                required={required} // Basic HTML5 required
                step={step}
                min={min}
                // No 'disabled' needed here as all displayed fields are editable
              />
            </div>
          ))}

          {/* Action Buttons */}
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 mt-2 border-t">
            <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">Cancel</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {isEditing ? "Update Details" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryItemModal;