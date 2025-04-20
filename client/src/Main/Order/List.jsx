// Updated List.jsx that groups items by supplier with edit support
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useOrderCart } from "../OrderCartContext";
import {
  getInventory,
  getSuppliers,
  createOrder,
  addOrderDetails,
  updateItem 
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
  const { cartItems, clearCart } = useOrderCart();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    productid: "",
    quantity: "",
    price: "",
    supplier_name: "",
  });
  const [groupedItems, setGroupedItems] = useStateWithLocalStorage("groupedOrderItems", {});
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editedItem, setEditedItem] = useState(null);

  useEffect(() => {
    getInventory().then(setProducts);
    getSuppliers().then(setSuppliers);
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      const newGrouped = { ...groupedItems };
      cartItems.forEach(ci => {
        const supplier = suppliers.find(s => s.supplierid === ci.supplierid)?.supplier_name;
        if (!supplier) return;
        if (!newGrouped[supplier]) newGrouped[supplier] = [];
        newGrouped[supplier].push({
          productid: ci.productid,
          product_name: ci.product_name,
          quantity: ci.requested_quantity,
          price: ci.unit_price,
          supplier_name: supplier,
        });
      });
      setGroupedItems(newGrouped);
      clearCart();
    }
  }, [cartItems]);

  const handleAddItem = () => {
    const { productid, quantity, price, supplier_name } = formData;
    if (productid && quantity && price && supplier_name) {
      const product = products.find(p => p.productid.toString() === productid);
      const newItem = {
        productid,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        product_name: product?.product_name || "",
        supplier_name,
      };
      setGroupedItems(prev => {
        const current = prev[supplier_name] || [];
        return { ...prev, [supplier_name]: [...current, newItem] };
      });
      setFormData({ productid: "", quantity: "", price: "", supplier_name: "" });
    }
  };

  const handleEditItem = (supplier, index) => {
    setEditingSupplier(supplier);
    setEditingIndex(index);
    setEditedItem({ ...groupedItems[supplier][index] });
  };

  const handleSaveEdit = () => {
    setGroupedItems(prev => {
      const updated = [...prev[editingSupplier]];
      updated[editingIndex] = editedItem;
      return { ...prev, [editingSupplier]: updated };
    });
    setEditingIndex(null);
    setEditedItem(null);
    setEditingSupplier(null);
  };

  const handleDeleteItem = (supplier, index) => {
    setGroupedItems(prev => {
      const updated = [...prev[supplier]];
      updated.splice(index, 1);
      if (updated.length === 0) {
        const { [supplier]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [supplier]: updated };
    });
  };

  const handlePlaceOrderForSupplier = async (supplierName, items) => {
    const supplierid = suppliers.find(s => s.supplier_name === supplierName)?.supplierid;
    if (!supplierid) return alert("Supplier not found");
  
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
  
    const order = await createOrder({
      order_date: new Date().toISOString().split("T")[0],
      total_amount: total,
      supplierid,
      userid: user.userid,
    });
  
    const detailItems = items.map(item => ({
      orderid: order.orderid,
      productid: item.productid,
      supplierid,
      unit_price: item.price,
      requested_quantity: item.quantity,
    }));
  
    await addOrderDetails(detailItems);
  
    // 🛠️ Patch supplierid in products if missing
    for (const item of detailItems) {
      const product = products.find(p => p.productid === item.productid);
      if (!product?.supplierid || product?.supplier?.supplier_name === "N/A") {
        try {
          await updateItem(item.productid, { supplierid: item.supplierid });
        } catch (err) {
          console.warn(`Could not update product ${item.productid}:`, err.message);
        }
      }
    }
  
    alert(`Order placed for ${supplierName}`);
  
    setGroupedItems(prev => {
      const copy = { ...prev };
      delete copy[supplierName];
      return copy;
    });
  };  

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-center mb-4">
        {new Date().toLocaleDateString()}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <select
          name="productid"
          value={formData.productid}
          onChange={e => setFormData({ ...formData, productid: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">Select Product</option>
          {products.map(p => (
            <option key={p.productid} value={p.productid}>{p.product_name}</option>
          ))}
        </select>
        <input type="number" name="quantity" value={formData.quantity}
          onChange={e => setFormData({ ...formData, quantity: e.target.value })}
          placeholder="Quantity" className="border rounded px-3 py-2" />
        <input type="number" name="price" value={formData.price}
          onChange={e => setFormData({ ...formData, price: e.target.value })}
          placeholder="Price" className="border rounded px-3 py-2" />
        <input name="supplier_name" list="supplier-options" value={formData.supplier_name}
          onChange={e => setFormData({ ...formData, supplier_name: e.target.value })}
          placeholder="Supplier Name" className="border rounded px-3 py-2" />
        <datalist id="supplier-options">
          {suppliers.map(s => <option key={s.supplierid} value={s.supplier_name} />)}
        </datalist>
        <button className="bg-[#7E82A4] text-white rounded px-4 py-2 shadow" onClick={handleAddItem}>
          Add
        </button>
      </div>

      {Object.entries(groupedItems).map(([supplier, items]) => {
        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        const tax = subtotal * 0.05;
        const total = subtotal + tax;

        return (
          <div key={supplier} className="mb-8 border p-4 rounded shadow bg-white">
            <h3 className="text-lg font-semibold mb-2">Supplier: {supplier}</h3>
            <table className="min-w-full mb-4">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Quantity</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{item.product_name}</td>
                    <td className="px-3 py-2">
                      {editingIndex === idx && editingSupplier === supplier ? (
                        <input
                          type="number"
                          value={editedItem.quantity}
                          onChange={e => setEditedItem({ ...editedItem, quantity: e.target.value })}
                          className="border rounded px-2 py-1 w-20"
                        />
                      ) : item.quantity}
                    </td>
                    <td className="px-3 py-2">
                      {editingIndex === idx && editingSupplier === supplier ? (
                        <input
                          type="number"
                          value={editedItem.price}
                          onChange={e => setEditedItem({ ...editedItem, price: e.target.value })}
                          className="border rounded px-2 py-1 w-20"
                        />
                      ) : `$${parseFloat(item.price).toFixed(2)}`}
                    </td>
                    <td className="px-3 py-2">
                      ${(item.quantity * item.price).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      {editingIndex === idx && editingSupplier === supplier ? (
                        <>
                          <button onClick={handleSaveEdit} className="bg-[#7E82A4] text-white px-3 py-1 rounded text-sm">Save</button>
                          <button onClick={() => { setEditingIndex(null); setEditedItem(null); setEditingSupplier(null); }} className="bg-gray-300 text-black px-3 py-1 rounded text-sm">Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => handleEditItem(supplier, idx)} className="bg-[#7E82A4] text-white px-3 py-1 rounded text-sm">Edit</button>
                      )}
                      <button onClick={() => handleDeleteItem(supplier, idx)} className="bg-[#D99292] text-white px-3 py-1 rounded text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right mb-2">
              <p>Subtotal: ${subtotal.toFixed(2)}</p>
              <p>Tax (5%): ${tax.toFixed(2)}</p>
              <p className="font-bold">Total: ${total.toFixed(2)}</p>
            </div>
            {user?.role === "admin" ? (
              <button className="bg-[#7E82A4] text-white px-4 py-2 rounded" onClick={() => handlePlaceOrderForSupplier(supplier, items)}>
                Place Order for {supplier}
              </button>
            ) : (
              <p className="italic text-sm text-gray-500">Only admins can place orders.</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderList;