import React, { useEffect, useState } from "react";
import {
  getPendingOrders,
  getProcessingOrders,
  updateOrderStatus,
  addInventoryStock,
} from "../../api";

const OrderPending = () => {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [deliveryDates, setDeliveryDates] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const pending = await getPendingOrders();
        const processing = await getProcessingOrders();
        const all = [...pending, ...processing].sort(
          (a, b) => new Date(b.order_date) - new Date(a.order_date)
        );

        setOrders(all);

        const defaults = {};
        all.forEach((order) => {
          const defaultDate = new Date(
            new Date(order.order_date).getTime() + 7 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0];
          defaults[order.orderid] = defaultDate;
        });
        setDeliveryDates(defaults);
      } catch (err) {
        console.error("Error loading orders:", err);
      }
    };

    fetchOrders();
  }, []);

  const toggleExpand = (orderid) => {
    setExpanded((prev) => (prev === orderid ? null : orderid));
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

  const handleStatusChange = async (orderid, newStatus) => {
    const originalOrders = [...orders];
    const updated = orders.map((order) =>
      order.orderid === orderid ? { ...order, order_status: newStatus } : order
    );
    setOrders(updated);

    try {
      await updateOrderStatus(orderid, newStatus);

      if (newStatus === "processing") {
        const newlyUpdatedOrder = updated.find(o => o.orderid === orderid);
        if (newlyUpdatedOrder && !deliveryDates[orderid]) {
           const defaultDate = new Date(
             new Date(newlyUpdatedOrder.order_date).getTime() +
               7 * 24 * 60 * 60 * 1000
           )
             .toISOString()
             .split("T")[0];
           setDeliveryDates((prev) => ({ ...prev, [orderid]: defaultDate }));
        }
      }

    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update order status.");
      setOrders(originalOrders);
    }
  };


  const handleDateChange = (orderid, newDate) => {
    setDeliveryDates((prev) => ({ ...prev, [orderid]: newDate }));
  };

  const markAsDelivered = async (orderid) => {
    try {
      const order = orders.find((o) => o.orderid === orderid);
      if (!order) return;

      if (!order.order_detail || order.order_detail.length === 0) {
        console.warn(`Order ${orderid} has no details to process for stock.`);
      } else {
        for (const item of order.order_detail) {
          const productid = item.products?.productid || item.productid;
          if (!productid) {
            console.error("Missing productid in item:", item);
            alert(`Cannot update inventory for item ${item.products?.product_name || 'Unknown'}: product ID is missing.`);
            return;
          }
          await addInventoryStock(productid, item.requested_quantity);
        }
      }

      await updateOrderStatus(orderid, "delivered");
      setOrders((prev) => prev.filter((order) => order.orderid !== orderid));
    } catch (error) {
      console.error("Failed to mark as delivered and update stock:", error);
      alert("Something went wrong while marking as delivered.");
    }
  };

  const cancelOrder = async (orderid) => {
    const originalOrders = [...orders];
    setOrders((prev) => prev.filter((order) => order.orderid !== orderid));

    try {
      await updateOrderStatus(orderid, "cancelled");
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("Failed to cancel the order.");
      setOrders(originalOrders);
    }
  };

  const renderOrderSection = (title, filterStatus) => {
    const filtered = orders.filter((o) => o.order_status === filterStatus);
    return (
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-[#2F4271]">{title}</h2>
        {filtered.length === 0 ? (
          <p className="text-gray-500">No {filterStatus} orders at the moment.</p>
        ) : (
          filtered.map((order) => (
            <div key={order.orderid} className="mb-4 border border-gray-200 rounded-lg shadow-sm">
              <div
                className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-4 bg-gray-50 px-4 py-3 rounded-t-lg cursor-pointer"
                onClick={() => toggleExpand(order.orderid)}
              >
                <div className="flex-grow">
                  <h3 className="text-base sm:text-lg font-semibold text-[#2F4271]">
                    Order #{order.orderid}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Placed: {formatDate(order.order_date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: ${order.total_amount?.toFixed(2)}
                  </p>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 items-center text-sm mt-1">
                    <label htmlFor={`delivery-${order.orderid}`} className="text-gray-700 font-medium whitespace-nowrap">
                      Expected Delivery:
                    </label>
                    <input
                      id={`delivery-${order.orderid}`}
                      type="date"
                      value={deliveryDates[order.orderid] || ""}
                      onChange={(e) =>
                        handleDateChange(order.orderid, e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="border border-gray-300 px-2 py-1 rounded text-sm focus:ring-1 focus:ring-[#8DACE5] focus:border-[#8DACE5] outline-none"
                      min={new Date(order.order_date).toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                    <select
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-[#8DACE5] focus:border-[#8DACE5] outline-none"
                        value={order.order_status}
                        onChange={(e) => handleStatusChange(order.orderid, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                    </select>
                    <button
                        className="text-xs bg-[#7E82A4] hover:bg-[#6c7094] text-white px-3 py-1.5 rounded transition-colors flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); markAsDelivered(order.orderid); }}
                    >
                        Mark Delivered
                    </button>
                    {order.order_status === "pending" && (
                        <button
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded transition-colors flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); cancelOrder(order.orderid); }}
                        >
                        Cancel
                        </button>
                    )}
                     <span className="text-xl text-gray-500 pl-2 md:pl-0">
                        {expanded === order.orderid ? "▲" : "▼"}
                    </span>
                </div>
              </div>

              {expanded === order.orderid && (
                <div className="bg-white p-4 border-t border-gray-200">
                  <div className="overflow-x-auto">
                     <table className="min-w-full text-sm align-middle">
                        <thead className="bg-gray-50">
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-semibold text-gray-600">Product</th>
                            <th className="text-center py-2 px-3 font-semibold text-gray-600">Quantity</th>
                            <th className="text-center py-2 px-3 font-semibold text-gray-600">Unit Price</th>
                            <th className="text-center py-2 px-3 font-semibold text-gray-600">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {order.order_detail && order.order_detail.length > 0 ? (
                             order.order_detail.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="py-2 px-3 text-left">
                                  {item.products?.product_name || 'N/A'}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {item.requested_quantity}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  ${item.unit_price?.toFixed(2) || '0.00'}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  $
                                  {(
                                    (item.unit_price || 0) * (item.requested_quantity || 0)
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                               <td colSpan="4" className="text-center py-4 text-gray-500">No order details available.</td>
                            </tr>
                          )}
                        </tbody>
                     </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div>
      {renderOrderSection("Pending Orders", "pending")}
      {renderOrderSection("Processing Orders", "processing")}
    </div>
  );
};

export default OrderPending;