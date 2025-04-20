import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useOrderCart } from "../OrderCartContext";
import {
  getInventory,
  getSuppliers,
  createOrder,
  addOrderDetails,
  getSupplierByName,
} from "../../api";

function useStateWithLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

const OrderList = () => {
  const { user } = useAuth();
  const { cartItems, removeItem, clearCart } = useOrderCart();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    productid: "",
    quantity: "",
    price: "",
    supplier_name: "",
  });

  const [items, setItems] = useStateWithLocalStorage("orderItems", []);

  const [editingIndex, setEditingIndex] = useState(null);
  const [editedItem, setEditedItem] = useState(null);

  useEffect(() => {
    getInventory().then(setProducts);
    getSuppliers().then(setSuppliers);
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      setItems((prev) => {
        const productIdsInList = new Set(prev.map((item) => item.productid));

        const merged = cartItems
          .filter((ci) => !productIdsInList.has(ci.productid))
          .map((ci) => ({
            productid: ci.productid,
            product_name: ci.product_name,
            quantity: ci.requested_quantity,
            price: ci.unit_price,
            supplierid: ci.supplierid,
            supplier_name:
              suppliers.find((s) => s.supplierid === ci.supplierid)
                ?.supplier_name || "",
          }));

        return [...prev, ...merged];
      });
      clearCart();
    }
  }, [cartItems]);

  const handleAddItem = () => {
    if (
      formData.productid &&
      formData.quantity &&
      formData.price &&
      formData.supplier_name
    ) {
      const product = products.find(
        (p) => p.productid.toString() === formData.productid
      );
      const newItem = {
        ...formData,
        product_name: product?.product_name || "",
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
      };
      setItems([...items, newItem]);
      setFormData({
        productid: "",
        quantity: "",
        price: "",
        supplier_name: "",
      });
    }
  };

  const handleEditItem = (index) => {
    setEditingIndex(index);
    const item = items[index];
    setEditedItem({
      quantity: item.quantity,
      price: item.price,
      supplier_name: item.supplier_name,
    });
  };

  const handleSaveEdit = (index) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      ...editedItem,
    };
    setItems(updatedItems);
    setEditingIndex(null);
    setEditedItem(null);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    const supplierid = suppliers.find(
      (s) => s.supplier_name === items[0]?.supplier_name
    )?.supplierid;

    if (!supplierid) return alert("Supplier not found or invalid");

    const order = await createOrder({
      order_date: new Date().toISOString().split("T")[0],
      total_amount: total,
      supplierid,
      userid: user.userid,
    });

    const detailItems = items.map((item) => ({
      orderid: order.orderid,
      productid: item.productid,
      supplierid: supplierid,
      unit_price: item.price,
      requested_quantity: item.quantity,
    }));

    await addOrderDetails(detailItems);
    alert("Order placed successfully");
    setItems([]);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-center w-full">
          {new Date().toLocaleDateString()}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <select
          name="productid"
          value={formData.productid}
          onChange={(e) =>
            setFormData({ ...formData, productid: e.target.value })
          }
          className="border rounded px-3 py-2"
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p.productid} value={p.productid}>
              {p.product_name}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="quantity"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({ ...formData, quantity: e.target.value })
          }
          placeholder="Enter quantity"
          className="border rounded px-3 py-2"
        />
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="Enter price"
          className="border rounded px-3 py-2"
        />
        <input
          name="supplier_name"
          list="supplier-options"
          value={formData.supplier_name}
          onChange={(e) =>
            setFormData({ ...formData, supplier_name: e.target.value })
          }
          placeholder="Enter Supplier Name"
          className="border rounded px-3 py-2"
        />

        <datalist id="supplier-options">
          {suppliers.map((s) => (
            <option key={s.supplierid} value={s.supplier_name} />
          ))}
        </datalist>

        <button
          className="bg-[#7E82A4] text-white rounded px-4 py-2 shadow"
          onClick={handleAddItem}
        >
          Add
        </button>
      </div>

      <table className="min-w-full bg-white shadow rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Product</th>
            <th className="px-4 py-2">Quantity</th>
            <th className="px-4 py-2 underline">Price</th>
            <th className="px-4 py-2">Total Cost</th>
            <th className="px-4 py-2">Supplier</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{item.product_name}</td>
              <td className="px-4 py-2">
                {editingIndex === index ? (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20"
                    value={editedItem.quantity}
                    onChange={(e) =>
                      setEditedItem({ ...editedItem, quantity: e.target.value })
                    }
                  />
                ) : (
                  item.quantity
                )}
              </td>
              <td className="px-4 py-2">
                {editingIndex === index ? (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-24"
                    value={editedItem.price}
                    onChange={(e) =>
                      setEditedItem({ ...editedItem, price: e.target.value })
                    }
                  />
                ) : (
                  `$${parseFloat(item.price).toFixed(2)}`
                )}
              </td>
              <td className="px-4 py-2">
                ${(item.quantity * item.price).toFixed(2)}
              </td>
              <td className="px-4 py-2">
                {editingIndex === index ? (
                  <input
                    className="border rounded px-2 py-1"
                    value={editedItem.supplier_name}
                    onChange={(e) =>
                      setEditedItem({
                        ...editedItem,
                        supplier_name: e.target.value,
                      })
                    }
                    list="supplier-options"
                  />
                ) : (
                  item.supplier_name
                )}
              </td>

              <td className="px-4 py-2 space-x-2">
                {editingIndex === index ? (
                  <>
                    <button
                      className="bg-[#7E82A4] text-white px-3 py-1 rounded text-sm"
                      onClick={() => handleSaveEdit(index)}
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-300 text-black px-3 py-1 rounded text-sm"
                      onClick={() => {
                        setEditingIndex(null);
                        setEditedItem(null);
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="bg-[#7E82A4] text-white px-3 py-1 rounded text-sm"
                    onClick={() => handleEditItem(index)}
                  >
                    Edit
                  </button>
                )}
                <button
                  className="bg-[#D99292] text-white px-3 py-1 rounded text-sm"
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between mt-4">
        <div></div>
        <div className="text-right space-y-1">
          <p>
            Subtotal: <span>${subtotal.toFixed(2)}</span>
          </p>
          <p>
            Tax: <span>${tax.toFixed(2)}</span>
          </p>
          <p>
            Total: <span>${total.toFixed(2)}</span>
          </p>
        </div>
      </div>

      <div className="text-center mt-6">
        {user?.role === "admin" ? (
          <button
            className="bg-[#7E82A4] text-white px-6 py-2 rounded shadow"
            onClick={handlePlaceOrder}
          >
            Place Order
          </button>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Only admins can place orders.
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderList;
