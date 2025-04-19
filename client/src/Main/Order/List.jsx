import React, { useState, useEffect } from 'react';
import { getInventory, getOrderDetails, addOrderDetail } from '../../api';

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
    requested_quantity: 1,
    unit_price: '',
    supplierid: ''
  });

  const today = new Date().toLocaleDateString();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const inventory = await getInventory();
        setProducts(inventory);
        const orderDetails = await getOrderDetails();
        setOrders(orderDetails);
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
      const added = await addOrderDetail(formData);
      const product = products.find(p => p.productid === parseInt(formData.productid));
      const product_name = product?.product_name || 'Unknown';

      setOrders([{ ...added, product_name }, ...orders]);
      setShowAddForm(false);
      setFormData({ productid: '', requested_quantity: 1, unit_price: '', supplierid: '' });
    } catch (err) {
      console.error('Error adding order detail:', err);
    }
  };

  const subtotal = orders.reduce((acc, item) => acc + item.requested_quantity * item.unit_price, 0);
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
            <input name="requested_quantity" type="number" min="1" value={formData.requested_quantity} onChange={handleChange} className="border rounded px-3 py-2" />
            <input name="unit_price" type="number" min="0" step="0.01" value={formData.unit_price} onChange={handleChange} placeholder="$ per unit" className="border rounded px-3 py-2" />
            <input
              name="supplierid"
              value={formData.supplierid}
              onChange={handleChange}
              placeholder="Supplier ID"
              className="border rounded px-3 py-2"
            />
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
              <td className="px-4 py-2">{item.products?.product_name || item.product_name || 'Unknown'}</td>
              <td className="px-4 py-2">{item.requested_quantity}</td>
              <td className="px-4 py-2">${parseFloat(item.unit_price).toFixed(2)}</td>
              <td className="px-4 py-2">${(item.requested_quantity * item.unit_price).toFixed(2)}</td>
              <td className="px-4 py-2">{item.suppliers?.supplier_name || item.supplier_name || item.supplierid}</td>
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
