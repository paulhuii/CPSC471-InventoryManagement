import React from 'react';

const OrderList = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-center mb-4">February 14, 2025</h2>
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
          <tr className="border-t">
            <td className="px-4 py-2">Whole Milk 2% Can</td>
            <td className="px-4 py-2"><button>-</button> 3 <button>+</button></td>
            <td className="px-4 py-2">$7.00/can</td>
            <td className="px-4 py-2">$21.00</td>
            <td className="px-4 py-2">
              <select className="border rounded px-2">
                <option>Market</option>
                <option>LocalS</option>
              </select>
            </td>
            <td className="px-4 py-2 space-x-2">
              <button className="bg-[#7E82A4] text-white px-3 py-1 rounded text-sm">Edit</button>
              <button className="bg-[#D99292] text-white px-3 py-1 rounded text-sm">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="flex justify-between mt-4">
        <div></div>
        <div className="text-right space-y-1">
          <p>Subtotal: <span>101.00</span></p>
          <p>Tax: <span>5.05</span></p>
          <p>Total: <span>106.05</span></p>
        </div>
      </div>
      <div className="text-center mt-6">
        <button className="bg-[#7E82A4] text-white px-6 py-2 rounded shadow">Place Order</button>
      </div>
    </div>
  );
};

export default OrderList;
