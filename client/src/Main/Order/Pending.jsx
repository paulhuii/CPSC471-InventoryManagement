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
        const all = [...pending, ...processing];

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
    const updated = orders.map((order) =>
      order.orderid === orderid ? { ...order, order_status: newStatus } : order
    );
    setOrders(updated);
    await updateOrderStatus(orderid, newStatus);

    if (newStatus === "processing") {
      const processing = await getProcessingOrders();
      const newlyUpdated = processing.find((o) => o.orderid === orderid);
      if (newlyUpdated) {
        setOrders((prev) => [
          ...prev.filter((o) => o.orderid !== orderid),
          newlyUpdated,
        ]);
        setDeliveryDates((prev) => ({
          ...prev,
          [orderid]: new Date(
            new Date(newlyUpdated.order_date).getTime() +
              7 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0],
        }));
      }
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
        alert("This order has no details.");
        return;
      }

      for (const item of order.order_detail) {
        const productid = item.products?.productid || item.productid;

        if (!productid) {
          //console.error(" Missing productid in item:", item);
          alert("Cannot update inventory: product ID is missing.");
          return;
        }

        //console.log(" Adding stock for productid:", productid);
        await addInventoryStock(productid, item.requested_quantity);
      }

      await updateOrderStatus(orderid, "delivered");
      setOrders((prev) => prev.filter((order) => order.orderid !== orderid));
    } catch (error) {
      console.error("Failed to mark as delivered and update stock:", error);
      alert("Something went wrong while marking as delivered.");
    }
  };

  const cancelOrder = async (orderid) => {
    try {
      await updateOrderStatus(orderid, "cancelled");
      setOrders((prev) => prev.filter((order) => order.orderid !== orderid));
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  const renderOrderSection = (title, filterStatus) => {
    const filtered = orders.filter((o) => o.order_status === filterStatus);
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {filtered.length === 0 ? (
          <p>No {filterStatus} orders at the moment.</p>
        ) : (
          filtered.map((order) => (
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
                  <div className="flex gap-2 items-center text-sm">
                    <label htmlFor={`delivery-${order.orderid}`}>
                      Expected Delivery:
                    </label>
                    <input
                      id={`delivery-${order.orderid}`}
                      type="date"
                      value={deliveryDates[order.orderid] || ""}
                      onChange={(e) =>
                        handleDateChange(order.orderid, e.target.value)
                      }
                      className="border px-2 py-1 rounded"
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={order.order_status}
                    onChange={(e) =>
                      handleStatusChange(order.orderid, e.target.value)
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                  </select>
                  <button
                    className="text-xs bg-[#7E82A4] text-white px-3 py-1 rounded"
                    onClick={() => markAsDelivered(order.orderid)}
                  >
                    Mark Delivered
                  </button>
                  {order.order_status === "pending" && (
                    <button
                      className="text-xs bg-red-500 text-white px-3 py-1 rounded"
                      onClick={() => cancelOrder(order.orderid)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <span className="text-xl">
                  {expanded === order.orderid ? "▲" : "▼"}
                </span>
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
                          <td className="text-center">
                            {item.requested_quantity}
                          </td>
                          <td className="text-center">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="text-center">
                            $
                            {(
                              item.unit_price * item.requested_quantity
                            ).toFixed(2)}
                          </td>
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

  return (
    <div className="p-6">
      {renderOrderSection("Pending Orders", "pending")}
      {renderOrderSection("Processing Orders", "processing")}
    </div>
  );
};

export default OrderPending;
