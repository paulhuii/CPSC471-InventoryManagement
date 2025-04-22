import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const tabs = [
  { path: 'restock', label: 'Restock Recommendations' },
  { path: 'list', label: 'Order List' },
  { path: 'pending', label: 'Pending Order' },
  { path: 'history', label: 'Order History' },
];

const Order = () => {
  const location = useLocation();
  const activePath = location.pathname.split('/').pop();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="border-b border-gray-200 pb-4">
        <div className="flex gap-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `text-md font-semibold px-4 py-2 transition-colors whitespace-nowrap ${
                  isActive || activePath === path
                    ? 'bg-[#8DACE5] text-white rounded'
                    : 'text-gray-700 hover:text-black'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
};

export default Order;