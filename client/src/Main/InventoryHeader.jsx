// src/Main/InventoryHeader.jsx
import React from 'react';

// Define or import icons here
const SearchIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);
const FilterIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);
const XMarkIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


function InventoryHeader({
  user, // Pass the whole user object or just the role
  searchTerm,
  onSearchChange,
  onOpenFilterModal,
  onClearFilters,
  onOpenAddModal,
  activeFilterCount,
}) {
  const userRole = user?.role?.toLowerCase();

  return (
    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
      {/* Left Side: Title */}
      <div>
        {userRole === "admin" && (
          <div className="text-3xl sm:text-4xl lg:text-5xl font-medium text-gray-700 mb-1 sm:mb-2">
            Hello Admin
          </div>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-green-900">Product List</h2>
      </div>

      {/* Right Side: Controls */}
      <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-2">
        {/* Search Bar */}
        <div className="relative w-full sm:w-72 lg:w-80">
          <input
            type="text"
            placeholder="Search by Product or Supplier..."
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            aria-label="Search inventory items"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Filter and Add Buttons */}
        <div className="flex items-center justify-end gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="flex items-center px-3 py-2 text-xs sm:text-sm text-red-600 border border-red-300 rounded-md shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 whitespace-nowrap"
              aria-label="Clear applied filters"
              title="Clear Filters"
            >
              <XMarkIcon className="w-3 h-3 mr-1" />
              Clear Filters ({activeFilterCount})
            </button>
          )}

          {/* Filter Button - Always show? Or only admin? Decide based on requirements */}
          {/* Let's assume all users can filter */}
          <button
              onClick={onOpenFilterModal}
              className="relative p-2 text-gray-600 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              aria-label="Open filters"
              title="Filters"
          >
              <FilterIcon className="h-5 w-5" />
               {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                        {activeFilterCount}
                    </span>
                )}
          </button>


          {userRole === 'admin' && (
            <button
              onClick={onOpenAddModal}
              className="text-black px-3 sm:px-4 py-2 rounded shadow whitespace-nowrap text-xs sm:text-sm"
              style={{ backgroundColor: "#8DACE5" }}
            >
              + Add Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryHeader;