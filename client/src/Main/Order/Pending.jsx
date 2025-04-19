import React, { useEffect, useState } from 'react';
import { getPendingOrders } from '../../api';

const OrderPending = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getPendingOrders()
      .then(setOrders)
      .catch(err => console.error('Error loading pending orders:', err));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Pending Orders</h2>
      {orders.length === 0 ? (
        <p>No pending orders at the moment.</p>
      ) : (
        orders.map(order => (
          <div key={order.orderid} className="bg-white rounded shadow p-4 mb-4">
            <h3 className="text-lg font-bold mb-2">Order #{order.orderid}</h3>
            <p className="text-sm mb-1">Date: {order.order_date}</p>
            <p className="text-sm mb-1">Supplier: {order.suppliers?.supplier_name || 'N/A'}</p>
            <p className="text-sm mb-2">Status: {order.order_status}</p>

            <table className="w-full text-sm mt-2 border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Product</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.order_detail.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{item.products?.product_name || 'Unknown'}</td>
                    <td className="p-2">{item.requested_quantity}</td>
                    <td className="p-2">${parseFloat(item.unit_price).toFixed(2)}</td>
                    <td className="p-2">${(item.unit_price * item.requested_quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-right mt-2 font-semibold">Total Amount: ${parseFloat(order.total_amount).toFixed(2)}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default OrderPending;
