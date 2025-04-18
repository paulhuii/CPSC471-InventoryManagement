import React, { useState, useEffect } from 'react';
import { getInventory, placeOrder, getOrders } from '../../api';



const supplierSuggestions = [
  "GreenLeaf Suppliers",
  "DairyDelight Inc.",
  "BakeHouse Provisions",
  "SnackWorld Distributors",
  "FreshFarm Co."
];

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    productid: '',
    quantity: 1,
    price: '',
    supplier: ''
  });

  const today = new Date().toLocaleDateString();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const inventory = await getInventory();
        setProducts(inventory);
        const existingOrders = await getOrders();
        setOrders(existingOrders);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOrder = async () => {
    try {
      const orderData = {
        productid: parseInt(formData.productid),
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        supplier: formData.supplier
      };
  
      const added = await placeOrder(orderData);
  
      const product = products.find(p => p.productid === orderData.productid);
      const product_name = product?.product_name || 'Unknown';
  
      setOrders([{ ...added, product_name }, ...orders]);
      setShowAddForm(false);
      setFormData({ productid: '', quantity: 1, price: '', supplier: '' });
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order. Please check your input.');
    }
  };
  

  const subtotal = orders.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{today}</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="bg-[#8DACE5] text-white px-4 py-2 rounded shadow">
          + Add Product to Order
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-4 mb-6 rounded shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <select name="productid" value={formData.productid} onChange={handleChange} className="border rounded px-3 py-2">
              <option value="">Select Product</option>
              {products.map(p => (
                <option key={p.productid} value={p.productid}>{p.product_name}</option>
              ))}
            </select>
            <input name="quantity" type="number" min="1" value={formData.quantity} onChange={handleChange} className="border rounded px-3 py-2" />
            <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} placeholder="$ per unit" className="border rounded px-3 py-2" />
            <input
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              list="supplier-options"
              placeholder="Enter Supplier"
              className="border rounded px-3 py-2"
            />
            <datalist id="supplier-options">
              {supplierSuggestions.map((s, i) => (
                <option key={i} value={s} />
              ))}
            </datalist>
          </div>
          <div className="text-right mt-4">
            <button onClick={handleAddOrder} className="bg-[#7E82A4] text-white px-4 py-2 rounded">Add</button>
          </div>
        </div>
      )}

      <table className="min-w-full bg-white shadow rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Product</th>
            <th className="px-4 py-2">Quantity</th>
            <th className="px-4 py-2">Price</th>
            <th className="px-4 py-2">Total</th>
            <th className="px-4 py-2">Supplier</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{item.product_name}</td>
              <td className="px-4 py-2">{item.quantity}</td>
              <td className="px-4 py-2">${parseFloat(item.price).toFixed(2)}</td>
              <td className="px-4 py-2">${(item.quantity * item.price).toFixed(2)}</td>
              <td className="px-4 py-2">{item.supplier}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between mt-4">
        <div></div>
        <div className="text-right space-y-1">
          <p>Subtotal: <span>${subtotal.toFixed(2)}</span></p>
          <p>Tax: <span>${tax.toFixed(2)}</span></p>
          <p>Total: <span>${total.toFixed(2)}</span></p>
        </div>
      </div>
    </div>
  );
};

export default OrderList;
