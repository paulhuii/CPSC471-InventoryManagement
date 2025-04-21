// client/src/Main/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    getPendingOrders,
    getRestockRecommendations,
    getReportSummary,
    getInventory, 
    getDeliveredOrders 
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useOrderCart } from './OrderCartContext';

const DashboardWidgetCard = ({ title, children, className = '', titleClassName = '' }) => (
    <div className={`bg-white p-4 rounded-lg shadow border border-gray-200 ${className}`}>
        <h3 className={`text-base font-semibold text-gray-600 mb-3 ${titleClassName}`}>{title}</h3>
        {children}
    </div>
);

// --- Helper to determine stock status ---
const getStockStatus = (stock, minQty) => {
    if (stock <= 0) return "critical"; // Out of Stock
    if (stock < minQty) return "low";    // Low Stock
    return "healthy"; // In Stock
};

// --- Main Dashboard Component ---
function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToCart } = useOrderCart();

    // Data States
    const [pendingOrders, setPendingOrders] = useState([]);
    const [restockItems, setRestockItems] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [allInventory, setAllInventory] = useState([]); // For stock levels
    const [deliveredOrders, setDeliveredOrders] = useState([]); // For purchase overview

    // Derived State
    const [stockLevelPercentages, setStockLevelPercentages] = useState({ healthy: 0, low: 0, critical: 0 });
    const [purchaseTotals, setPurchaseTotals] = useState({ currentMonth: 0, lastMonth: 0 });
    const [lastPlacedOrder, setLastPlacedOrder] = useState(null); // Using latest pending as proxy

    // Loading/Error State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [
                    pendingData,
                    restockData,
                    summaryData,
                    inventoryData, // Fetch inventory
                    deliveredData // Fetch delivered orders
                ] = await Promise.all([
                    getPendingOrders(),
                    getRestockRecommendations(),
                    getReportSummary(),
                    getInventory(),
                    getDeliveredOrders()
                ]);

                // --- Process Raw Data ---
                const currentPendingOrders = Array.isArray(pendingData) ? pendingData : [];
                const currentRestockItems = Array.isArray(restockData) ? restockData : [];
                const currentInventory = Array.isArray(inventoryData) ? inventoryData : [];
                const currentDeliveredOrders = Array.isArray(deliveredData) ? deliveredData : [];

                setPendingOrders(currentPendingOrders);
                setRestockItems(currentRestockItems);
                setTopProducts((summaryData?.topProductsByFrequency || []).sort((a, b) => b.count - a.count));
                setAllInventory(currentInventory);
                setDeliveredOrders(currentDeliveredOrders);

                // --- Calculate Stock Level Percentages ---
                const activeProducts = currentInventory.filter(item => item.is_active);
                const totalActive = activeProducts.length;
                if (totalActive > 0) {
                    let healthyCount = 0;
                    let lowCount = 0;
                    let criticalCount = 0;
                    activeProducts.forEach(item => {
                        const status = getStockStatus(item.current_stock, item.min_quantity);
                        if (status === 'healthy') healthyCount++;
                        else if (status === 'low') lowCount++;
                        else criticalCount++;
                    });
                    setStockLevelPercentages({
                        healthy: Math.round((healthyCount / totalActive) * 100),
                        low: Math.round((lowCount / totalActive) * 100),
                        critical: Math.round((criticalCount / totalActive) * 100),
                    });
                } else {
                     setStockLevelPercentages({ healthy: 0, low: 0, critical: 0 });
                }

                // --- Calculate Purchase Overview Totals ---
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonth = lastMonthDate.getMonth();
                const lastMonthYear = lastMonthDate.getFullYear();

                let currentMonthTotal = 0;
                let lastMonthTotal = 0;

                currentDeliveredOrders.forEach(order => {
                    try {
                         const orderDateStr = order.delivered_date || order.order_date;
                         if (!orderDateStr) return; 

                        const orderDate = new Date(orderDateStr);
                        const orderMonth = orderDate.getMonth();
                        const orderYear = orderDate.getFullYear();

                        if (orderMonth === currentMonth && orderYear === currentYear) {
                            currentMonthTotal += order.total_amount || 0;
                        } else if (orderMonth === lastMonth && orderYear === lastMonthYear) {
                            lastMonthTotal += order.total_amount || 0;
                        }
                    } catch(e) {
                         console.warn(`Could not parse date for order ${order.orderid}: ${order.delivered_date || order.order_date}`);
                    }
                });
                setPurchaseTotals({ currentMonth: currentMonthTotal, lastMonth: lastMonthTotal });
                setLastPlacedOrder(currentPendingOrders.length > 0 ? currentPendingOrders[0] : null);


            } catch (err) {
                console.error("Failed to load dashboard data:", err);
                setError("Could not load dashboard information. Please try again later.");
                if (err.response?.status === 401 || err.message.includes("401")) {
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]); 

    const formatDate = (dateStr, options = { month: 'short', day: 'numeric' }) => {
        if (!dateStr) return 'N/A';
        try { return new Date(dateStr).toLocaleDateString('en-US', options); }
        catch (e) { return 'Invalid Date'; }
    }

    const handleRestockClick = (item) => {
        const hasRequiredFields = 
             item.productid !== undefined &&
             item.product_name !== undefined &&
             item.current_stock !== undefined &&
             item.min_quantity !== undefined &&
             item.case_price !== undefined && 
             item.supplierid !== undefined;

        if (hasRequiredFields) {
            addToCart(item);
            alert(`${item.product_name} added to order list!`);
        } else {
             console.warn(" Missing product fields for restock:", item);
             alert("This item is missing data and cannot be added directly.");
        }
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Loading Dashboard...</div>;
    if (error) return <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>;

    return (
        <div className="p-4 md:p-6 space-y-6 min-h-screen">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

                {/* --- Pending Orders & Purchase Overview Column --- */}
                 <div className="md:col-span-1 space-y-5">
                     {/* Pending Orders (Count & Last Placed) */}
                     <DashboardWidgetCard title="Pending Orders">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-700 text-white rounded-lg p-4 flex flex-col items-center justify-center aspect-square">
                                <span className="text-4xl font-bold">{pendingOrders.length}</span>
                                <span className="text-xs mt-1 text-slate-300">Pending</span>
                            </div>
                             <div className="bg-[#697B5D] text-white rounded-lg p-3 flex flex-col justify-center aspect-square text-center">
                                {lastPlacedOrder ? (
                                    <>
                                        <span className="text-2xl font-semibold block">{formatDate(lastPlacedOrder.order_date, {month: 'long', day: 'numeric'})}</span>
                                        <span className="text-xs mt-1 block truncate" title={lastPlacedOrder.suppliers?.supplier_name || 'Order ' + lastPlacedOrder.orderid}>
                                            {lastPlacedOrder.suppliers?.supplier_name || 'Order ' + lastPlacedOrder.orderid}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-xs text-emerald-200">No orders placed yet</span>
                                )}
                            </div>
                        </div>
                        {/* Link to view pending */}
                         {pendingOrders.length > 0 && (
                            <div className="text-center mt-3">
                                <Link to="/orders/pending" className="text-sm text-blue-600 hover:underline">
                                    View Pending List 
                                </Link>
                            </div>
                         )}
                    </DashboardWidgetCard>

                     {/* Purchase Overview (Calculated) */}
                    <DashboardWidgetCard title="Purchase Overview">
                         <div className="space-y-3">
                            <div className="bg-slate-600 text-white rounded-lg p-3 text-center">
                                <span className="text-xs text-slate-300 block">This month Spend</span>
                                <span className="text-xl font-semibold block">${purchaseTotals.currentMonth.toFixed(2)}</span>
                            </div>
                             <div className="bg-slate-600 text-white rounded-lg p-3 text-center">
                                <span className="text-xs text-slate-300 block">Last month Spend</span>
                                <span className="text-xl font-semibold block">${purchaseTotals.lastMonth.toFixed(2)}</span>
                            </div>
                        </div>
                         <div className="text-right mt-3">
                            <Link to="/orders/history" className="text-sm text-blue-600 hover:underline">
                                View Order History 
                            </Link>
                        </div>
                    </DashboardWidgetCard>
                 </div>

                {/* --- Restock Recommendations Widget --- */}
                <DashboardWidgetCard title="Restock Recommendations" className="md:col-span-1">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                         {restockItems.length > 0 ? (
                            restockItems.map(item => (
                                <div key={item.productid} className="bg-[#EAC9E7] p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-sm text-purple-900">{item.product_name}</p>
                                        <p className="text-xs text-purple-700">
                                            {item.current_stock} left (Min: {item.min_quantity})
                                        </p>
                                    </div>
                                    
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic text-sm">Inventory levels look good!</p>
                        )}
                    </div>
                     {restockItems.length > 0 && (
                        <div className="text-center mt-4">
                            <Link to="/orders/restock" className="text-sm text-blue-600 hover:underline">
                                View Full Stock List 
                            </Link>
                        </div>
                    )}
                </DashboardWidgetCard>

                {/* --- Most Used & Stock Levels Column --- */}
                 <div className="md:col-span-1 space-y-5">
                    {/* Most Used Inventory */}
                    <DashboardWidgetCard title="Most Used Inventory">
                         <div className="space-y-3">
                            {topProducts.slice(0, 5).map(item => (
                                <div key={item.id} className="text-sm">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-gray-700 font-medium">{item.name}</span>
                                        <span className="text-xs text-gray-500">({item.count} orders)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-[#EADBA0] h-2.5 rounded-full" style={{ width: `${Math.min(100, item.count > 0 ? (item.count / (topProducts[0]?.count || 1)) * 100 : 0)}%` }}></div>
                                    </div>
                                </div>
                            ))}
                             {topProducts.length === 0 && (
                                <p className="text-gray-500 italic text-sm">No order data available.</p>
                            )}
                        </div>
                         {topProducts.length > 0 && (
                             <div className="text-right mt-4">
                                <Link to="/reports" className="text-sm text-blue-600 hover:underline">
                                    View Full Report 
                                </Link>
                            </div>
                         )}
                    </DashboardWidgetCard>

                    {/* Stock Levels */}
                    <DashboardWidgetCard title="Stock Levels">
                        <div className="space-y-2">
                             <div className="bg-[#C0E0AC] p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="font-medium text-sm text-green-800">Healthy Stock</span>
                                </div>
                                <span className="font-semibold text-green-800"> {stockLevelPercentages.healthy}% </span>
                             </div>
                            <div className="bg-[#F9E3BF] p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="font-medium text-sm text-yellow-800">Low Stock</span>

                                </div>
                                <span className="font-semibold text-yellow-800"> {stockLevelPercentages.low}% </span>
                             </div>
                             <div className="bg-[#D99292] p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <span className="font-medium text-sm text-red-800">Critical Stock</span>
                                    {/* <span className="text-xs text-red-700 block">Items out of stock</span> */}
                                </div>
                                <span className="font-semibold text-red-800"> {stockLevelPercentages.critical}% </span>
                             </div>
                        </div>
                        <div className="text-right mt-3">
                            <Link to="/inventory" className="text-sm text-blue-600 hover:underline">
                                View Inventory 
                            </Link>
                        </div>
                    </DashboardWidgetCard>
                 </div>

            </div>
        </div>
    );
}

export default Dashboard;