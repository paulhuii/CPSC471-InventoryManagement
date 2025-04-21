// client/src/Main/Reports.jsx
import React, { useState, useEffect } from 'react';
// Import the new API function
import { getReportSummary, getMonthlyTopProducts } from '../api';
import { useAuth } from '../context/AuthContext';

// --- Reusable Summary Card Widget --- (Keep as before)
const SummaryCard = ({ title, value, format = 'number', icon, color = 'blue' }) => {
    // ... same code ...
    const formattedValue = () => {
        if (value === undefined || value === null) return 'N/A';
        if (format === 'currency') {
            return `$${Number(value).toFixed(2)}`;
        }
        if (format === 'integer') {
             return Number(value).toLocaleString(); // Basic number formatting
        }
        return value; // Default plain number
    };

    const colorClasses = {
        blue: 'bg-blue-100 border-blue-300 text-blue-800',
        green: 'bg-green-100 border-green-300 text-green-800',
        yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
        red: 'bg-red-100 border-red-300 text-red-800',
    };

    return (
        <div className={`border rounded-lg p-4 shadow-sm ${colorClasses[color]}`}>
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium uppercase text-gray-600">{title}</h3>
                {/* Optional Icon can go here */}
            </div>
            <p className="text-2xl font-bold mt-2">{formattedValue()}</p>
        </div>
    );
};


// --- Reusable Top List Widget --- (Keep as before)
const TopListWidget = ({ title, items = [], valueKey, valueLabel = 'Count' }) => {
    // ... same code ...
        return (
        <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">{title}</h3>
            {items && items.length > 0 ? (
                <ul className="space-y-2 text-sm">
                    {items.map((item, index) => (
                        <li key={item.id || index} className="flex justify-between items-center border-b pb-1 last:border-b-0">
                            <span className="text-gray-800 truncate pr-2">{item.name || 'Unknown Product'}</span>
                            <span className="font-medium text-gray-600 whitespace-nowrap">
                                {item[valueKey]?.toLocaleString() ?? 'N/A'} {valueLabel && ` ${valueLabel}`}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500 italic">No data available.</p>
            )}
        </div>
    );
};

// --- Main Reports Page Component ---
function Reports() {
    // State for summary data
    const [summaryData, setSummaryData] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState(null);

    // --- NEW: State for Monthly Report ---
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JS months are 0-11
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [monthlyTopProducts, setMonthlyTopProducts] = useState([]);
    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [monthlyError, setMonthlyError] = useState(null);
    // const { user } = useAuth();

    // --- Fetch Summary Data ---
    useEffect(() => {
        const fetchSummary = async () => {
            setSummaryLoading(true);
            setSummaryError(null);
            try {
                const data = await getReportSummary();
                setSummaryData(data);
            } catch (err) {
                console.error("Failed to load summary reports:", err);
                setSummaryError(err.response?.data?.error || err.message || "Could not load summary data.");
            } finally {
                setSummaryLoading(false);
            }
        };
        fetchSummary();
    }, []); // Fetch summary only once on mount

    // --- Fetch Monthly Data when year/month changes ---
    useEffect(() => {
        const fetchMonthlyData = async () => {
            setMonthlyLoading(true);
            setMonthlyError(null);
            setMonthlyTopProducts([]); // Clear previous results
            try {
                const data = await getMonthlyTopProducts(selectedYear, selectedMonth);
                setMonthlyTopProducts(data);
            } catch (err) {
                 console.error(`Failed to load monthly top products for ${selectedYear}-${selectedMonth}:`, err);
                 setMonthlyError(err.response?.data?.error || err.message || `Could not load monthly data for ${selectedYear}-${selectedMonth}.`);
            } finally {
                 setMonthlyLoading(false);
            }
        };

        // Only fetch if year and month are validly selected
        if (selectedYear && selectedMonth) {
            fetchMonthlyData();
        }
    }, [selectedYear, selectedMonth]); // Re-fetch when year or month changes


    // --- Render Helper for Year/Month Selects ---
    const renderYearOptions = () => {
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) { // Show last 5 years + current
            years.push(y);
        }
        return years.map(y => <option key={y} value={y}>{y}</option>);
    };
    const renderMonthOptions = () => {
        const months = [
            { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
            { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
            { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
            { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' }
        ];
        return months.map(m => <option key={m.value} value={m.value}>{m.name}</option>);
    };


    // --- Combined Loading/Error States ---
    if (summaryLoading) { // Prioritize showing loading for the initial summary
        return <div className="p-6 text-center text-gray-500">Loading reports...</div>;
    }
    if (summaryError) { // Show summary error prominently if it occurs
        return (
            <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded">
                <p>Error loading summary reports:</p>
                <p className="text-sm mt-1">{summaryError}</p>
            </div>
        );
    }
    if (!summaryData) { // Should not happen if loading/error handled, but good fallback
        return <div className="p-6 text-center text-gray-500">No summary report data found.</div>;
    }

    // --- Render the Report Page Layout ---
    return (
        <div className="p-4 md:p-6 space-y-8"> {/* Increased spacing */}
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports Dashboard</h1>

            {/* Section 1: Summary Cards */}
            <section>
                 <h2 className="text-xl font-semibold text-gray-700 mb-4">Overall Summary</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard title="Total Delivered Orders" value={summaryData.totalDeliveredOrders} format="integer" color="blue" />
                    <SummaryCard title="Total Delivered Value" value={summaryData.totalDeliveredValue} format="currency" color="green" />
                    <SummaryCard title="Active Product Count" value={summaryData.totalActiveProducts} format="integer" color="yellow" />
                    <SummaryCard title="Est. Inventory Value" value={summaryData.estimatedInventoryValue} format="currency" color="red" />
                 </div>
            </section>

            {/* Section 2: General Top Product Lists */}
             <section>
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">All-Time Top Products (Delivered Orders)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <TopListWidget title="Top 5 by Orders" items={summaryData.topProductsByFrequency} valueKey="count" valueLabel="Orders" />
                    <TopListWidget title="Top 5 by Quantity" items={summaryData.topProductsByQuantity} valueKey="totalQuantity" valueLabel="Units" />
                    <TopListWidget title="Top 5 by Value" items={summaryData.topProductsByValue} valueKey="totalValue" valueLabel="$ Value" />
                 </div>
             </section>

             {/* Section 3: Monthly Top Products */}
             <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Monthly Top Ordered Products</h2>
                {/* Date Selection Controls */}
                <div className="flex flex-wrap items-center gap-4 mb-4 bg-gray-50 p-3 rounded-md border">
                    <label htmlFor="report-month" className="text-sm font-medium text-gray-700">Month:</label>
                    <select
                        id="report-month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                        className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        {renderMonthOptions()}
                    </select>
                    <label htmlFor="report-year" className="text-sm font-medium text-gray-700">Year:</label>
                     <select
                        id="report-year"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                        className="p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        {renderYearOptions()}
                    </select>
                </div>

                 {/* Monthly Report Display Area */}
                 {monthlyLoading ? (
                     <div className="text-center py-4 text-gray-500">Loading monthly data...</div>
                 ) : monthlyError ? (
                     <div className="p-3 bg-red-50 border border-red-300 text-red-600 rounded text-sm">
                         Error: {monthlyError}
                     </div>
                 ) : (
                     <TopListWidget
                        // Dynamic title based on selection
                        title={`Top 5 by Orders (${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear})`}
                        items={monthlyTopProducts}
                        valueKey="count" // The backend returns 'count'
                        valueLabel="Orders"
                    />
                 )}
             </section>

             {/* Add more sections/widgets here */}

        </div>
    );
}

export default Reports;