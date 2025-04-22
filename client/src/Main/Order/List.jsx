// src/Main/Order/List.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useOrderCart } from "../OrderCartContext";
import {
  getInventory,
  getSuppliers,
  createOrder,
  addOrderDetails,
  // updateItem, // Not used directly here anymore
  addItem as addProductApi,
  createSupplier, // <-- Import new API function
} from "../../api";
import InventoryItemModal from "../InventoryItemModal";
import AddItemForm from "./AddItemForm";
import SupplierOrderSection from "./SupplierOrderSection";
import AddSupplierModal from "./AddSupplierModal"; // <-- Import the new modal
import { useStateWithLocalStorage } from "../hooks/useStateWithLocalStorage";

const OrderList = () => {
  const { user } = useAuth();
  const { cartItems, clearCart } = useOrderCart();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [groupedItems, setGroupedItems] = useStateWithLocalStorage(
    "groupedOrderItems",
    {}
  );
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editedItem, setEditedItem] = useState(null);

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [addProductError, setAddProductError] = useState(null);

  // --- State for Add Supplier Modal ---
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [supplierNameToAdd, setSupplierNameToAdd] = useState("");
  const [addSupplierError, setAddSupplierError] = useState(null);
  // Store the item data that triggered the add supplier flow (less used now but kept for potential edge cases)
  const [pendingItemData, setPendingItemData] = useState(null);

  // --- Data Fetching ---
  const fetchProducts = useCallback(async () => {
    try {
      const data = await getInventory();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers(); // Fetch suppliers on mount
  }, [fetchProducts, fetchSuppliers]); // Updated dependencies

  // --- Process Cart Items (from Restock page) ---
  useEffect(() => {
    if (cartItems.length > 0 && suppliers.length > 0) {
      const newGrouped = { ...groupedItems };
      let changed = false;
      cartItems.forEach((ci) => {
        // Find supplier using supplierid from the product item (cartItem)
        const supplierInfo = suppliers.find(
          (s) => s.supplierid === ci.supplierid
        );
        const supplierName = supplierInfo?.supplier_name;

        if (!supplierName) {
          console.warn(
            `Supplier not found for ID: ${ci.supplierid} for product ${ci.product_name}`
          );
          return; // Skip if supplier doesn't exist in the current supplier list
        }

        if (!newGrouped[supplierName]) newGrouped[supplierName] = [];

        const existingIndex = newGrouped[supplierName].findIndex(
          (item) => item.productid === ci.productid
        );

        if (existingIndex === -1) {
          // Item not in the list for this supplier, add it
          newGrouped[supplierName].push({
            productid: ci.productid,
            product_name: ci.product_name,
            quantity: ci.requested_quantity, // Quantity calculated in context
            price: ci.unit_price, // Price might need fetching/setting later or using product default
            order_unit: ci.order_unit || "", // Default or from product
            supplier_name: supplierName, // Confirmed supplier name
          });
          changed = true;
        } else {
          // Optional: Handle if item already exists (e.g., update quantity, alert user)
          console.log(
            `Item ${ci.product_name} from restock recommendations already exists for ${supplierName}. Skipping.`
          );
          // Example: Update quantity if needed
          // newGrouped[supplierName][existingIndex].quantity += ci.requested_quantity;
          // changed = true;
        }
      });

      if (changed) {
        setGroupedItems(newGrouped);
      }
      // Clear the cart processed from the restock page immediately
      clearCart();
    }
  }, [cartItems, clearCart, groupedItems, setGroupedItems, suppliers]);

  // --- Add Product Modal Handlers ---
  const handleOpenAddProductModal = () => {
    setAddProductError(null);
    setIsAddProductModalOpen(true);
  };
  const handleCloseAddProductModal = () => {
    setIsAddProductModalOpen(false);
    setAddProductError(null);
  };
  const handleAddProductSubmit = async (newProductData) => {
    try {
      setAddProductError(null);
      const addedProductArray = await addProductApi(newProductData);
      if (addedProductArray && addedProductArray.length > 0) {
        handleCloseAddProductModal();
        await fetchProducts(); // Refresh product list
        alert(
          `Product "${
            addedProductArray[0]?.product_name || "New Product"
          }" added successfully! You can now select it for your order.`
        );
      } else {
        throw new Error("Failed to add product, no data returned.");
      }
    } catch (err) {
      console.error("Failed to add product from order list:", err);
      setAddProductError(
        err.response?.data?.error || err.message || "Error adding product."
      );
    }
  };

  // --- Add Supplier Modal Handlers ---
  // Called by the '+' button in AddItemForm
  const handleOpenAddSupplierModal = (nameFromInput = "") => {
    setSupplierNameToAdd(nameFromInput);
    setPendingItemData(null); // Not adding an item directly, just the supplier
    setAddSupplierError(null);
    setIsAddSupplierModalOpen(true);
  };

  const handleCloseAddSupplierModal = () => {
    setIsAddSupplierModalOpen(false);
    setSupplierNameToAdd("");
    setAddSupplierError(null);
    setPendingItemData(null);
  };

  const handleAddSupplierSubmit = async (newSupplierData) => {
    try {
      setAddSupplierError(null);
      const addedSupplier = await createSupplier(newSupplierData);

      if (addedSupplier?.supplierid) {
        await fetchSuppliers(); // Refresh the suppliers list
        await fetchProducts();
        handleCloseAddSupplierModal();
        alert(`Supplier "${addedSupplier.supplier_name}" added successfully!`);

        // If an item add was pending when opening the modal (less likely path now)
        if (pendingItemData) {
          addConfirmedItemToGroup(pendingItemData, addedSupplier.supplier_name);
          setPendingItemData(null);
        }
      } else {
        throw new Error("Failed to add supplier or no data returned.");
      }
    } catch (err) {
      console.error("Failed to add supplier:", err);
      setAddSupplierError(
        err.response?.data?.error ||
          err.message ||
          "An unexpected error occurred."
      );
      throw err; // Allow modal to display the error
    }
  };

  // --- Helper to add item to the grouped state ---
  const addConfirmedItemToGroup = (itemData, finalSupplierName) => {
    const product = products.find(
      (p) => Number(p.productid) === Number(itemData.productid)
    );
    if (!product) {
      alert("Product details missing, cannot add item.");
      return;
    }
    const newItem = {
      productid: parseInt(itemData.productid, 10),
      quantity: parseInt(itemData.quantity, 10),
      price: parseFloat(itemData.price),
      order_unit: itemData.order_unit,
      product_name: product.product_name,
      supplier_name: finalSupplierName, // Use the confirmed name
    };

    setGroupedItems((prev) => {
      const currentSupplierItems = prev[finalSupplierName] || [];
      const exists = currentSupplierItems.some(
        (item) => item.productid === newItem.productid
      );
      if (exists) {
        alert(
          `${newItem.product_name} is already in the order list for ${finalSupplierName}. Edit the existing entry.`
        );
        return prev; // Return previous state if item exists
      }
      // Add new item to the specific supplier's list
      return {
        ...prev,
        [finalSupplierName]: [...currentSupplierItems, newItem],
      };
    });
  };

  // --- Main "Add Item" Button Handler (from AddItemForm) ---
  const handleAddItem = (formData, resetCallback) => {
    const { productid, quantity, price, order_unit, supplier_name } = formData;

    // Basic validation
    if (!productid || !quantity || !price || !order_unit || !supplier_name) {
      alert(
        "Please fill in all fields (Product, Quantity, Price, Order Unit, Supplier) to add an item."
      );
      return;
    }

    // --- NEW: Validate product-supplier match ---
    const selectedSupplier = suppliers.find(
      (s) => s.supplier_name.toLowerCase() === supplier_name.toLowerCase()
    );
    const selectedSupplierId = selectedSupplier?.supplierid;

    const matchedProduct = products.find(
      (p) => Number(p.productid) === Number(productid)
    );
    const productSupplierId = matchedProduct?.supplierid;

    if (
      selectedSupplierId &&
      productSupplierId &&
      selectedSupplierId !== productSupplierId
    ) {
      const currentSupplierName =
        suppliers.find((s) => s.supplierid === productSupplierId)
          ?.supplier_name || "another supplier";

      alert(
        `The product "${matchedProduct.product_name}" is registered under "${currentSupplierName}". Please add it under "${supplier_name}" first before placing an order.`
      );
      return;
    }

    // --- Supplier exists check ---
    if (selectedSupplier) {
      // Supplier EXISTS: add with confirmed name
      addConfirmedItemToGroup(formData, selectedSupplier.supplier_name);
      resetCallback();
    } else {
      // Supplier DOES NOT EXIST: block action
      alert(
        `Supplier "${supplier_name}" not found. Please add it using the '+' button next to the supplier field.`
      );
    }
  };

  // --- Edit/Delete/Save Handlers for items in the list ---
  const handleEditItem = (supplier, index) => {
    setEditingSupplier(supplier);
    setEditingIndex(index);
    const itemToEdit = groupedItems[supplier][index];
    // Ensure quantity and price are numbers for the input fields
    setEditedItem({
      ...itemToEdit,
      quantity: parseInt(itemToEdit.quantity, 10) || 0,
      price: parseFloat(itemToEdit.price) || 0,
    });
  };

  const handleSaveEdit = () => {
    if (!editingSupplier || editingIndex === null || !editedItem) return;

    setGroupedItems((prev) => {
      const updatedSupplierItems = [...prev[editingSupplier]];
      // Ensure saved values are correctly typed numbers
      updatedSupplierItems[editingIndex] = {
        ...editedItem,
        quantity: parseInt(editedItem.quantity, 10) || 0, // Fallback to 0 if invalid
        price: parseFloat(editedItem.price) || 0, // Fallback to 0 if invalid
      };
      return { ...prev, [editingSupplier]: updatedSupplierItems };
    });
    // Reset editing state
    setEditingIndex(null);
    setEditedItem(null);
    setEditingSupplier(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedItem(null);
    setEditingSupplier(null);
  };

  const handleDeleteItem = (supplier, index) => {
    const itemToDelete = groupedItems[supplier]?.[index];
    if (!itemToDelete) return;

    if (
      window.confirm(
        `Remove ${itemToDelete.product_name} from the order list for ${supplier}?`
      )
    ) {
      setGroupedItems((prev) => {
        const updatedSupplierItems = [...prev[supplier]];
        updatedSupplierItems.splice(index, 1); // Remove item at index

        // If this was the last item for the supplier, remove the supplier group entirely
        if (updatedSupplierItems.length === 0) {
          const { [supplier]: _, ...rest } = prev; // Destructure to remove the supplier key
          return rest;
        }
        // Otherwise, update the supplier's item list
        return { ...prev, [supplier]: updatedSupplierItems };
      });
      // If the deleted item was being edited, cancel the edit mode
      if (editingSupplier === supplier && editingIndex === index) {
        handleCancelEdit();
      }
    }
  };

  // --- Place Order Handler (Admin Only) ---
  const handlePlaceOrderForSupplier = async (supplierName, items) => {
    const supplier = suppliers.find((s) => s.supplier_name === supplierName);
    if (!supplier) {
      alert(
        `Could not find supplier details for ${supplierName}. Order cannot be placed.`
      );
      return;
    }
    const supplierid = supplier.supplierid;

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.price),
      0
    );
    const tax = subtotal * 0.05; // Assuming 5% tax
    const total_amount = subtotal + tax;

    if (!user || !user.userid) {
      alert("User not identified. Cannot place order.");
      return;
    }

    if (items.length === 0) {
      alert("Cannot place an empty order.");
      return;
    }

    try {
      // 1. Create the main order record
      const orderHeader = {
        order_date: new Date().toISOString().split("T")[0], // Today's date
        total_amount: total_amount,
        supplierid: supplierid,
        userid: user.userid, // User placing the order
      };
      const createdOrder = await createOrder(orderHeader);

      if (!createdOrder || !createdOrder.orderid) {
        throw new Error("Failed to create order header. No order ID received.");
      }
      const orderid = createdOrder.orderid;

      // 2. Prepare and add the order details (line items)
      const detailItems = items.map((item) => ({
        orderid: orderid,
        productid: item.productid,
        supplierid: supplierid, // Associate detail with the order's supplier
        unit_price: Number(item.price),
        requested_quantity: Number(item.quantity),
        order_unit: item.order_unit,
        // received_quantity defaults to 0, received_date defaults to null in DB/API
      }));

      await addOrderDetails(detailItems);

      // 3. Success: Notify user and remove items from the list state
      alert(
        `Order placed successfully for ${supplierName}! Order ID: ${orderid}`
      );
      setGroupedItems((prev) => {
        const { [supplierName]: _, ...rest } = prev; // Remove the placed order group
        return rest;
      });
    } catch (error) {
      console.error(`Failed to place order for ${supplierName}:`, error);
      alert(
        `Error placing order: ${error.message || "An unknown error occurred."}`
      );
    }
  };

  // --- Render ---
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">
        Create New Order - {new Date().toLocaleDateString()}
      </h2>

      {/* Form to add items to the list */}
      <AddItemForm
        products={products}
        suppliers={suppliers}
        onAddItem={handleAddItem} // For the main "Add Item" button
        onOpenAddProductModal={handleOpenAddProductModal} // For the product '+' button
        onOpenAddSupplierModal={handleOpenAddSupplierModal} // For the supplier '+' button
      />

      {/* Display Grouped Order Items by Supplier */}
      {Object.keys(groupedItems).length === 0 ? (
        <p className="text-center text-gray-500 italic mt-8">
          Your order list is empty. Add items using the form above or from the
          Restock page.
        </p>
      ) : (
        Object.entries(groupedItems).map(([supplier, items]) => (
          <SupplierOrderSection
            key={supplier}
            supplierName={supplier}
            items={items}
            userRole={user?.role?.toLowerCase()}
            editingIndex={editingIndex}
            editingSupplier={editingSupplier}
            editedItem={editedItem}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onPlaceOrder={handlePlaceOrderForSupplier}
            onEditedItemChange={setEditedItem} // Pass state setter for controlled input in row
          />
        ))
      )}

      {/* --- Modals --- */}
      {isAddProductModalOpen && (
        <InventoryItemModal
          item={null} // For adding new product
          onClose={handleCloseAddProductModal}
          onSubmit={handleAddProductSubmit}
          initialError={addProductError}
          suppliers={suppliers}
          isQuickAdd={false} // Not relevant here
        />
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierModalOpen && (
        <AddSupplierModal
          isOpen={isAddSupplierModalOpen}
          onClose={handleCloseAddSupplierModal}
          onSubmit={handleAddSupplierSubmit}
          initialSupplierName={supplierNameToAdd}
          initialError={addSupplierError}
        />
      )}
    </div>
  );
};

export default OrderList;
