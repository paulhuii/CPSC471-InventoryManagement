
import React, { useState } from "react";

function InventoryItemModal({ item, onClose, onSubmit, initialError }) {
  const isEditing = item !== null;

  const [formData, setFormData] = useState({
    product_name: item?.product_name || "",
    current_stock: item?.current_stock ?? "",
    max_quantity: item?.max_quantity ?? "",
    min_quantity: item?.min_quantity ?? "",
    expiration: item?.expiration
      ? new Date(item.expiration).toISOString().split("T")[0]
      : "",
    categoryid: item?.categoryid ?? "",
    supplierid: item?.supplierid ?? "",
  });

  const [error, setError] = useState(initialError);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val =
      type === "number" ? (value === "" ? "" : parseFloat(value)) : value;
    const finalValue =
      ["categoryid", "supplierid", "current_stock", "max_quantity", "min_quantity"].includes(name) && val === ""
        ? ""
        : val;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.product_name || formData.current_stock === "") {
      setError("Product Name and Current Stock are required.");
      return;
    }

    const dataToSubmit = { ...formData };
    for (const key of [
      "current_stock",
      "max_quantity",
      "min_quantity",
      "categoryid",
      "supplierid",
    ]) {
      if (dataToSubmit[key] === "") {
        dataToSubmit[key] = null;
      }
    }
    if (dataToSubmit.expiration === "") dataToSubmit.expiration = null;

    try {
      await onSubmit(dataToSubmit);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "An unexpected error occurred."
      );
      console.error("Modal Submit Error:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-gray-800">
          {isEditing ? "Edit Item" : "Add New Item"}
        </h3>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
            <button
              onClick={() => setError(null)}
              className="absolute top-0 right-0 px-2 py-1 text-red-500"
            >
              ×
            </button>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {[
            { label: "Product Name *", name: "product_name", type: "text" },
            { label: "Current Stock *", name: "current_stock", type: "number" },
            { label: "Max Quantity", name: "max_quantity", type: "number" },
            { label: "Min Quantity", name: "min_quantity", type: "number" },
            { label: "Expiration Date", name: "expiration", type: "date" },
            { label: "Category ID", name: "categoryid", type: "number" },
            { label: "Supplier ID", name: "supplierid", type: "number" },
          ].map(({ label, name, type }) => (
            <input
              key={name}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={label}
              name={name}
              type={type}
              value={formData[name]}
              onChange={handleChange}
              required={label.includes("*")}
            />
          ))}

          <div className="col-span-2 flex justify-end gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
            >
              {isEditing ? "Update Item" : "Add Item"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InventoryItemModal;
