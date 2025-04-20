import React, { useEffect, useState, useMemo, useCallback } from "react";
import { getDeliveredOrders } from "../../api";
import Modal from '../../components/Modal';

const OrderFilterModalContent = ({
    initialFilters,
    onApply,
    onReset,
    onClose,
    availableProducts,
    availableSuppliers
}) => {
    const [localFilters, setLocalFilters] = useState(
        initialFilters || { productNames: [], supplierNames: [], deliveryStatus: 'all' }
    );

    useEffect(() => {
        setLocalFilters(initialFilters || { productNames: [], supplierNames: [], deliveryStatus: 'all' });
    }, [initialFilters]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleProductCheckboxChange = (event) => {
        const { value, checked } = event.target;
        setLocalFilters(prev => {
            const currentProductNames = prev.productNames || [];
            if (checked) {
                return { ...prev, productNames: [...currentProductNames, value] };
            } else {
                return { ...prev, productNames: currentProductNames.filter(name => name !== value) };
            }
        });
    };

    const handleSupplierCheckboxChange = (event) => {
        const { value, checked } = event.target;
        setLocalFilters(prev => {
            const currentSupplierNames = prev.supplierNames || [];
            if (checked) {
                return { ...prev, supplierNames: [...currentSupplierNames, value] };
            } else {
                return { ...prev, supplierNames: currentSupplierNames.filter(name => name !== value) };
            }
        });
    };

    const handleApply = () => { onApply(localFilters); };

    const handleReset = () => {
        const defaultFilters = { productNames: [], supplierNames: [], deliveryStatus: 'all' };
        setLocalFilters(defaultFilters);
        onReset();
    };

    const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
    const selectStyle = "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm mt-1 appearance-none bg-white";
    const checkboxLabelStyle = "flex items-center space-x-2 cursor-pointer px-2 py-1 hover:bg-gray-50 rounded";
    const checkboxInputStyle = "rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-offset-0 focus:ring-indigo-200 focus:ring-opacity-50";
    const checkboxContainerStyle = "max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1";
    const buttonBaseStyle = "px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
    const cancelButtonStyle = `${buttonBaseStyle} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500`;
    const resetButtonStyle = `${buttonBaseStyle} text-red-700 bg-red-100 border border-transparent hover:bg-red-200 focus:ring-red-500`;
    const applyButtonStyle = `${buttonBaseStyle} text-white bg-indigo-600 border border-transparent hover:bg-indigo-700 focus:ring-indigo-500`;

    return (
        <div>
            <h3 className="text-lg font-medium mb-4 text-gray-800">Filter Orders</h3>
            <div className="space-y-4 mb-6">
                <div>
                    <label className={labelStyle}>Products:</label>
                    <div className={checkboxContainerStyle}>
                        {availableProducts.length === 0 && <p className="text-sm text-gray-500 px-2">No products found.</p>}
                        {availableProducts.map(product => (
                            <label key={`prod-${product}`} className={checkboxLabelStyle}>
                                <input
                                    type="checkbox"
                                    name="productNames"
                                    value={product}
                                    checked={localFilters.productNames?.includes(product) || false}
                                    onChange={handleProductCheckboxChange}
                                    className={checkboxInputStyle}
                                />
                                <span className="text-sm">{product}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Suppliers:</label>
                    <div className={checkboxContainerStyle}>
                        {availableSuppliers.length === 0 && <p className="text-sm text-gray-500 px-2">No suppliers found.</p>}
                        {availableSuppliers.map(supplier => (
                            <label key={`supp-${supplier}`} className={checkboxLabelStyle}>
                                <input
                                    type="checkbox"
                                    name="supplierNames"
                                    value={supplier}
                                    checked={localFilters.supplierNames?.includes(supplier) || false}
                                    onChange={handleSupplierCheckboxChange}
                                    className={checkboxInputStyle}
                                />
                                <span className="text-sm">{supplier}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="deliveryStatusFilter" className={labelStyle}>Delivery Status:</label>
                    <select
                        id="deliveryStatusFilter"
                        name="deliveryStatus"
                        value={localFilters.deliveryStatus}
                        onChange={handleChange}
                        className={selectStyle}
                    >
                        <option value="all">All Statuses</option>
                        <option value="delivered">Delivered</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-3">
                <button type="button" onClick={onClose} className={cancelButtonStyle}> Cancel </button>
                <button type="button" onClick={handleReset} className={resetButtonStyle}> Reset </button>
                <button type="button" onClick={handleApply} className={applyButtonStyle}> Apply Filters </button>
            </div>
        </div>
    );
};

const FilterIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
);
const SortIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
);
const XMarkIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'order_date', direction: 'descending' });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const defaultFilters = useMemo(() => ({ productNames: [], supplierNames: [], deliveryStatus: 'all' }), []);
    const [activeFilters, setActiveFilters] = useState(defaultFilters);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getDeliveredOrders()
            .then((data) => {
                setOrders(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error loading orders:", err);
                setError("Failed to load order history.");
                setLoading(false);
            });
    }, []);

    const availableProducts = useMemo(() => {
        if (!orders || orders.length === 0) return [];
        const productSet = new Set();
        orders.forEach(order => {
            if (Array.isArray(order.order_detail)) {
                order.order_detail.forEach(item => {
                    if (item.products?.product_name) productSet.add(item.products.product_name);
                });
            }
        });
        return Array.from(productSet).sort((a, b) => a.localeCompare(b));
    }, [orders]);

    const availableSuppliers = useMemo(() => {
        if (!orders || orders.length === 0) return [];
        const supplierSet = new Set();
        orders.forEach(order => {
            if (Array.isArray(order.order_detail)) {
                order.order_detail.forEach(item => {
                    if (item.products?.supplier?.supplier_name) supplierSet.add(item.products.supplier.supplier_name);
                });
            }
        });
        return Array.from(supplierSet).sort((a, b) => a.localeCompare(b));
    }, [orders]);

    const filteredAndSortedOrders = useMemo(() => {
        let processedOrders = [...orders];
        const selectedProductNames = activeFilters.productNames || [];
        const selectedSupplierNames = activeFilters.supplierNames || [];
        const statusFilter = activeFilters.deliveryStatus;

        processedOrders = processedOrders.filter(order => {
            let matchesStatus = true;
            if (statusFilter === 'delivered') matchesStatus = !!order.delivered_date;
            else if (statusFilter === 'pending') matchesStatus = !order.delivered_date;
            if (!matchesStatus) return false;

            const matchesProduct = selectedProductNames.length === 0 || (
                Array.isArray(order.order_detail) &&
                order.order_detail.some(item =>
                    item.products?.product_name && selectedProductNames.includes(item.products.product_name)
                )
            );
            if (!matchesProduct) return false;

            const matchesSupplier = selectedSupplierNames.length === 0 || (
                Array.isArray(order.order_detail) &&
                order.order_detail.some(item =>
                    item.products?.supplier?.supplier_name && selectedSupplierNames.includes(item.products.supplier.supplier_name)
                )
            );
            return matchesSupplier;
        });

        if (sortConfig.key !== null) {
            processedOrders.sort((a, b) => {
                let aValue = a[sortConfig.key]; let bValue = b[sortConfig.key];
                if (sortConfig.key.includes('date')) { aValue = aValue ? new Date(aValue).getTime() : 0; bValue = bValue ? new Date(bValue).getTime() : 0; }
                else if (sortConfig.key === 'total_amount') { aValue = Number(aValue) || 0; bValue = Number(bValue) || 0; }
                else if (typeof aValue === 'string' && typeof bValue === 'string') { aValue = aValue.toLowerCase(); bValue = bValue.toLowerCase(); }
                else { aValue = aValue ?? ''; bValue = bValue ?? ''; }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return processedOrders;
    }, [orders, sortConfig, activeFilters]);

    const handleSortClick = () => {
        setSortConfig(prev => ({ ...prev, direction: prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    };
    const handleFilterIconClick = () => setIsFilterModalOpen(true);
    const handleCloseModal = useCallback(() => setIsFilterModalOpen(false), []);
    const handleApplyFilters = useCallback((filtersFromModal) => {
        setActiveFilters(filtersFromModal);
        setIsFilterModalOpen(false);
    }, []);
    const handleResetFilters = useCallback(() => {
        setActiveFilters(defaultFilters);
    }, [defaultFilters]);
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            console.error("Error formatting date:", dateStr, e);
            return 'Invalid Date';
        }
    };

    const activeFilterCount = useMemo(() => {
        return Object.entries(activeFilters).reduce((count, [key, value]) => {
            if (key === 'deliveryStatus' && value !== 'all') return count + 1;
            if (key === 'productNames' && Array.isArray(value) && value.length > 0) return count + 1;
            if (key === 'supplierNames' && Array.isArray(value) && value.length > 0) return count + 1;
            return count;
        }, 0);
    }, [activeFilters]);

    if (loading) return <div className="p-6 text-center">Loading order history...</div>;
    if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#2F4271]">Order History</h2>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleSortClick}
                        className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                        aria-label="Sort orders"
                        title={`Sort by Date (${sortConfig.direction === 'ascending' ? 'Oldest First' : 'Newest First'})`}
                    >
                        <SortIcon className="w-5 h-5 text-gray-600 hover:text-gray-800" />
                    </button>
                    <button
                        onClick={handleFilterIconClick}
                        className="relative p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                        aria-label="Filter orders"
                        title="Filter orders"
                    >
                        <FilterIcon className="w-5 h-5 text-gray-600 hover:text-gray-800" />
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={handleResetFilters}
                            className="flex items-center px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                            aria-label="Clear active filters"
                            title="Clear active filters"
                        >
                            <XMarkIcon className="w-3 h-3 mr-1" />
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            <Modal isOpen={isFilterModalOpen} onClose={handleCloseModal}>
                <OrderFilterModalContent
                    initialFilters={activeFilters}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                    onClose={handleCloseModal}
                    availableProducts={availableProducts}
                    availableSuppliers={availableSuppliers}
                />
            </Modal>

            {filteredAndSortedOrders.length === 0 ? (
                 <p className="text-gray-600 text-center py-4">
                     {activeFilterCount > 0 ? 'No orders match filters.' : 'No delivered orders yet.'}
                 </p>
             ) : (
                <div className="space-y-6">
                    {filteredAndSortedOrders.map((order) => (
                        <div key={order.orderid} className="border border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden">
                            <div className="flex justify-between items-center bg-gray-100 px-4 py-3 border-b border-gray-200">
                                <div className="w-1/3 text-left text-lg font-bold text-[#2F4271]">
                                   {formatDate(order.order_date)}
                                </div>
                                <div className="flex-grow text-center text-sm font-semibold text-gray-900 px-2">
                                   Total Cost: ${Number(order.total_amount)?.toFixed(2) ?? '0.00'}
                                </div>
                                <div className="w-1/3 flex justify-end items-center space-x-2">
                                    <div className="text-sm text-gray-700 text-right">
                                        {order.delivered_date ? `Delivered: ${formatDate(order.delivered_date)}` : 'Delivery Pending'}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm table-fixed">
                                        <thead className="bg-gray-50">
                                            <tr className="border-b border-gray-200">
                                                <th className="w-4/12 px-3 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Product</th>
                                                <th className="w-3/12 px-3 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Supplier</th>
                                                <th className="w-1/12 px-3 py-2 text-center font-medium text-gray-600 uppercase tracking-wider">Qty</th>
                                                <th className="w-2/12 px-3 py-2 text-center font-medium text-gray-600 uppercase tracking-wider">Price/Unit</th>
                                                <th className="w-2/12 px-3 py-2 text-right font-medium text-gray-600 uppercase tracking-wider">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {Array.isArray(order.order_detail) && order.order_detail.length > 0 ? (
                                                order.order_detail.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis text-left">{item.products?.product_name || 'N/A'}</td>
                                                        <td className="px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis text-left">{item.products?.supplier?.supplier_name || 'N/A'}</td>
                                                        <td className="px-3 py-2 text-center">{item.requested_quantity ?? 'N/A'}</td>
                                                        <td className="px-3 py-2 text-center">${Number(item.unit_price)?.toFixed(2) ?? '0.00'}</td>
                                                        <td className="px-3 py-2 text-right font-medium">${(Number(item.unit_price) * Number(item.requested_quantity))?.toFixed(2) ?? '0.00'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan="5" className="px-3 py-2 text-center text-gray-500 italic">Order details not available.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                 </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistory;