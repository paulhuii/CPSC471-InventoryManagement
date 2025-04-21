// client/src/Main/InventoryItemModal.jsx
import React, { useState, useEffect } from "react";

function InventoryItemModal({ item, onClose, onSubmit, initialError }) {
  const isEditing = item !== null;

  // Full state definition including fields used for editing
  const [formData, setFormData] = useState({
    product_name: "",
    current_stock: 0, // Default 0
    min_quantity: "",
    max_quantity: "",
    expiration: "",
    categoryid: "",
    supplierid: "",
    case_price: "",
    order_unit: "",
  });

  const [error, setError] = useState(initialError);

  useEffect(() => {
    setError(initialError);
  }, [initialError]);

  useEffect(() => {
    // Reset form when item changes (for both editing and switching to add mode)
    setFormData({
      product_name: item?.product_name || "",
      current_stock: item?.current_stock ?? 0, // Use existing stock if editing, else 0
      min_quantity: item?.min_quantity ?? "",
      max_quantity: item?.max_quantity ?? "",
      expiration: item?.expiration
        ? new Date(item.expiration).toISOString().split("T")[0]
        : "",
      categoryid: item?.categoryid ?? "",
      // These might be relevant if editing an existing item
      supplierid: item?.supplierid ?? "",
      case_price: item?.case_price ?? "",
      order_unit: item?.order_unit || "",
    });
    setError(null); // Clear errors when item changes
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val =
      type === "number" ? (value === "" ? "" : parseFloat(value)) : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // --- Field Validations ---
    if (!formData.product_name) {
      setError("Product Name is required.");
      return;
    }
    if (
      formData.current_stock === "" ||
      formData.current_stock === null ||
      isNaN(formData.current_stock) ||
      parseFloat(formData.current_stock) < 0
    ) {
      setError("Current Stock is required and cannot be negative.");
      return;
    }
    if (
      formData.min_quantity === "" ||
      formData.min_quantity === null ||
      isNaN(formData.min_quantity) ||
      parseFloat(formData.min_quantity) < 0
    ) {
      setError("Minimum Quantity is required and cannot be negative.");
      return;
    }
    if (
      formData.max_quantity !== null &&
      formData.max_quantity !== "" &&
      (isNaN(formData.max_quantity) || parseFloat(formData.max_quantity) < 0)
    ) {
      setError("Max Quantity must be a non-negative number if provided.");
      return;
    }
    if (
      formData.max_quantity !== null &&
      formData.max_quantity !== "" &&
      parseFloat(formData.max_quantity) < parseFloat(formData.min_quantity)
    ) {
      setError("Max Quantity cannot be less than Min Quantity.");
      return;
    }
    if (
      formData.categoryid !== null &&
      formData.categoryid !== "" &&
      isNaN(formData.categoryid)
    ) {
      setError("Category ID must be a number if provided.");
      return;
    }

    const coreData = {
      product_name: formData.product_name,
      current_stock: parseFloat(formData.current_stock),
      min_quantity: parseFloat(formData.min_quantity),
      max_quantity:
        formData.max_quantity === "" || formData.max_quantity === null
          ? null
          : parseFloat(formData.max_quantity),
      expiration: formData.expiration === "" ? null : formData.expiration,
      categoryid:
        formData.categoryid === "" || formData.categoryid === null
          ? null
          : parseInt(formData.categoryid, 10),
    };

    let dataToSubmit = coreData;

    // If editing, add productid and potentially other fields if they were edited
    if (isEditing && item?.productid) {
      dataToSubmit = {
        ...dataToSubmit, // Start with core data
        productid: item.productid,
        // Include other fields from formData if they are part of the PUT /inventory/:id expected payload
        supplierid:
          formData.supplierid === "" || formData.supplierid === null
            ? null
            : parseInt(formData.supplierid, 10),
        //case_price: formData.case_price === "" || formData.case_price === null ? null : parseFloat(formData.case_price),
        //order_unit: formData.order_unit || null,
      };
    }

    console.log(
      `Data being submitted (${isEditing ? "edit" : "add"}):`,
      dataToSubmit
    );

    try {
      await onSubmit(dataToSubmit);
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Submission failed."
      );
      console.error("Modal Submit Prop Error:", err);
    }
  };

  const allFields = [
    {
      label: "Product Name",
      name: "product_name",
      type: "text",
      required: true,
    },
    {
      label: "Current Stock",
      name: "current_stock",
      type: "number",
      required: true,
      min: "0",
    },
    {
      label: "Min Quantity",
      name: "min_quantity",
      type: "number",
      required: true,
      min: "0",
    },
    {
      label: "Max Quantity",
      name: "max_quantity",
      type: "number",
      required: false,
      min: "0",
    },
    {
      label: "Category ID",
      name: "categoryid",
      type: "number",
      required: false,
    },
    {
      label: "Expiration Date",
      name: "expiration",
      type: "date",
      required: false,
    },
    {
      label: "Supplier ID",
      name: "supplierid",
      type: "number",
      required: false,
      showInAddMode: false,
    },
    {
      label: "Price per Unit",
      name: "case_price",
      type: "number",
      required: false,
      step: "0.01",
      min: "0",
      showInAddMode: false,
    },
    {
      label: "Order Unit",
      name: "order_unit",
      type: "text",
      required: false,
      showInAddMode: false,
    },
  ];

  const fieldsToShow = isEditing
    ? allFields
    : allFields.filter((field) => field.showInAddMode !== false);

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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm">
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 bottom-0 right-0 px-3 py-1 text-red-500 hover:text-red-700 font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3"
          noValidate
        >
          {/* Render filtered fields */}
          {fieldsToShow.map(
            ({ label, name, type, required, placeholder, step, min }) => (
              // Adjust layout - make product name span full width
              <div
                key={name}
                className={name === "product_name" ? "md:col-span-2" : ""}
              >
                <label
                  htmlFor={name}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {label}
                </label>
                <input
                  id={name}
                  className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder={placeholder || label.replace(" *", "")}
                  name={name}
                  type={type}
                  value={formData[name] ?? ""}
                  onChange={handleChange}
                  required={required}
                  step={step}
                  min={min}
                />
              </div>
            )
          )}

          {/* Action Buttons */}
          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-4 mt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isEditing ? "Update Details" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryItemModal;
