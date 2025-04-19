import React, { useState, useEffect } from 'react';
import { getInventory, createOrder, addOrderDetails, getSuppliers } from '../../api';
import { useAuth } from '../../context/AuthContext';

const OrderList = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ productid: '', quantity: 1, price: '', supplierid: '', supplier_name: ''  });
  const { user } = useAuth();

  useEffect(() => {
    getInventory().then(setProducts).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const inventory = await getInventory();
        setProducts(inventory);
        const supplierList = await getSuppliers(); 
        setSuppliers(supplierList);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    fetchData();
  }, []);

  const handleAddItem = () => {
    const product = products.find(p => p.productid === parseInt(formData.productid));
    const supplier = suppliers.find(s => s.supplier_name === formData.supplier_name);
  
    if (!product || !supplier) return;
  
    setItems(prev => [...prev, {
      ...formData,
      product_name: product.product_name,
      supplierid: supplier.supplierid
      
    }]);
  
    setFormData({ productid: '', quantity: 1, price: '', supplier_name: '' });
  };
  

  const handlePlaceOrder = async () => {
    const total_amount = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const supplierid = parseInt(items[0]?.supplierid); // assumes all items use same supplier
  
    if (!user?.userid) {
      console.error("No userid found in AuthContext");
      return;
    }
  
    try {
      const newOrder = await createOrder({
        order_date: new Date().toISOString().split('T')[0],
        total_amount,
        supplierid,
        userid: user.userid,
        order_status: 'pending' // optionally set default status
      });
  
      const orderid = newOrder.orderid;
  
      await addOrderDetails(
        items.map(i => ({
          orderid,
          productid: parseInt(i.productid),
          unit_price: parseFloat(i.price),
          requested_quantity: parseInt(i.quantity),
          supplierid: parseInt(i.supplierid)
        }))
      );
  
      setItems([]);
    } catch (err) {
      console.error("Error placing order:", err);
    }
  };
  
  

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-center w-full">{new Date().toLocaleDateString()}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <select name="productid" value={formData.productid} onChange={e => setFormData({ ...formData, productid: e.target.value })} className="border rounded px-3 py-2">
          <option value="">Select Product</option>
          {products.map(p => <option key={p.productid} value={p.productid}>{p.product_name}</option>)}
        </select>
        <input type="number" name="quantity" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="Enter quantity" className="border rounded px-3 py-2" />
        <input type="number" name="price" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Enter price" className="border rounded px-3 py-2" />
        <input
            name="supplier_name"
            list="supplier-options"
            value={formData.supplier_name}
            onChange={e => setFormData({ ...formData, supplier_name: e.target.value })}
            placeholder="Enter Supplier Name"
            className="border rounded px-3 py-2"
        />

        <datalist id="supplier-options">
            {suppliers.map(s => (
                <option key={s.supplierid} value={s.supplier_name} />
            ))}
        </datalist>

        <button className="bg-[#7E82A4] text-white rounded px-4 py-2 shadow" onClick={handleAddItem}>Add</button>
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
              <td className="px-4 py-2">{item.quantity}</td>
              <td className="px-4 py-2">${parseFloat(item.price).toFixed(2)}</td>
              <td className="px-4 py-2">${(item.quantity * item.price).toFixed(2)}</td>
              <td className="px-4 py-2">{item.supplier_name}</td>
              <td className="px-4 py-2 space-x-2">
                <button className="bg-[#7E82A4] text-white px-3 py-1 rounded text-sm">Edit</button>
                <button className="bg-[#D99292] text-white px-3 py-1 rounded text-sm" onClick={() => setItems(items.filter((_, i) => i !== index))}>Delete</button>
              </td>
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

      <div className="text-center mt-6">
        <button className="bg-[#7E82A4] text-white px-6 py-2 rounded shadow" onClick={handlePlaceOrder}>Place Order</button>
      </div>
    </div>
  );
};

export default OrderList;