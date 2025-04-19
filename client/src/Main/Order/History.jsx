import React, { useEffect, useState } from 'react';
import { getDeliveredOrders } from '../../api';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getDeliveredOrders()
      .then(setOrders)
      .catch(err => console.error('Error loading delivered orders:', err));
  }, []);

  const toggleExpand = (orderid) => {
    setExpanded(prev => (prev === orderid ? null : orderid));
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Order History</h2>
      {orders.length === 0 ? (
        <p>No delivered orders yet.</p>
      ) : (
        orders.map(order => (
          <div key={order.orderid} className="mb-4 border rounded-lg">
            <div
              className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded-t-lg cursor-pointer"
              onClick={() => toggleExpand(order.orderid)}
            >
              <div>
                <h3 className="text-lg font-semibold text-[#2F4271]">
                  Order #{order.orderid} — {formatDate(order.order_date)}
                </h3>
                <p>Total Cost: ${order.total_amount?.toFixed(2)}</p>
              </div>
              <span className="text-xl">{expanded === order.orderid ? '▲' : '▼'}</span>
            </div>

            {expanded === order.orderid && (
              <div className="bg-white p-4 border-t">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.order_detail.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="py-2">{item.products.product_name}</td>
                        <td className="text-center">{item.requested_quantity}</td>
                        <td className="text-center">${item.unit_price.toFixed(2)}</td>
                        <td className="text-center">${(item.unit_price * item.requested_quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default OrderHistory;