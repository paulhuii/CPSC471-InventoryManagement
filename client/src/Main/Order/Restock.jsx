import React from 'react';

const OrderRestock = () => {
  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-[#D99292] text-white p-4 rounded-md">
        <h3 className="text-lg font-bold">Whole Milk 2%</h3>
        <p className="font-semibold">1 days</p>
        <button className="mt-2 px-4 py-1 border border-black bg-white text-black rounded">Restock Now</button>
      </div>
      <div className="bg-[#D99292] text-white p-4 rounded-md">
        <h3 className="text-lg font-bold">Oat Milk 2%</h3>
        <p className="font-semibold">2 days</p>
        <button className="mt-2 px-4 py-1 border border-black bg-white text-black rounded">Restock Now</button>
      </div>
      <div className="bg-[#F4D98E] p-4 rounded-md">
        <h3 className="text-lg font-bold">Coffee Bean</h3>
        <p className="font-semibold">5 days</p>
        <button className="mt-2 px-4 py-1 border border-black bg-white text-black rounded">Restock Now</button>
      </div>
    </div>
  );
};

export default OrderRestock;
