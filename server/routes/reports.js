// server/routes/reports.js
const express = require("express");
const router = express.Router();
const { supabase } = require("../utils/supabase");
const { authenticateToken, isAdmin } = require("../middleware/auth"); // Assuming reports might be admin-only

// --- GET /api/reports/summary ---
// Fetches various summary statistics
router.get("/summary", authenticateToken, /* Optional: isAdmin, */ async (req, res) => {
  try {
    // --- Total Delivered Orders Count ---
    const { count: totalDeliveredOrdersCount, error: countError } = await supabase
      .from("orders")
      .select('*', { count: "exact", head: true }) // Use head: true to only fetch the count
      .eq("order_status", "delivered");

    if (countError) throw countError;
    // If count is null (no rows found), default to 0
    const totalDeliveredOrders = totalDeliveredOrdersCount ?? 0;

    // --- Total Delivered Value (Sum) ---
    const { data: valueData, error: valueError } = await supabase
      .from("orders")
      .select("total_amount") // Select only the column to be summed
      .eq("order_status", "delivered");

    if (valueError) throw valueError;
    // Sum the amounts, defaulting to 0 if data is null/empty or amount is null
    const totalDeliveredValue = valueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;


    // --- Most Frequently Ordered Products (Top 5 from Delivered Orders) ---
    // Fetch delivered order IDs first
    const { data: deliveredOrderIdsData, error: deliveredIdsError } = await supabase
      .from('orders')
      .select('orderid')
      .eq('order_status', 'delivered');

    if (deliveredIdsError) throw deliveredIdsError;
    const deliveredOrderIds = deliveredOrderIdsData.map(o => o.orderid);

    // Fetch details only for those delivered orders
    let topProducts = []; // Default to empty array
    if (deliveredOrderIds.length > 0) {
        const { data: productDetailsData, error: productError } = await supabase
            .from("order_detail")
            .select(`
                requested_quantity,
                unit_price,
                products!inner (productid, product_name)
            `)
            .in('orderid', deliveredOrderIds); // Filter by the fetched IDs

        if (productError) throw productError;
        topProducts = productDetailsData || []; // Assign fetched data or keep empty
    }


    const productCounts = {};
    const productQuantities = {};
    const productValues = {};

    topProducts.forEach(item => {
        // Check if products relationship exists and has data
        if (!item.products || item.products.productid === undefined || item.products.product_name === undefined) {
            console.warn("Skipping order detail item due to missing product data:", item);
            return; // Skip this item if product info is missing
        }

        const productId = item.products.productid;
        const productName = item.products.product_name;
        const quantity = item.requested_quantity || 0;
        const value = quantity * (item.unit_price || 0);

        // Count occurrences
        if (!productCounts[productId]) {
            productCounts[productId] = { id: productId, name: productName, count: 0 };
        }
        productCounts[productId].count += 1;

        // Sum total quantity ordered
        if (!productQuantities[productId]) {
             productQuantities[productId] = { id: productId, name: productName, totalQuantity: 0 };
        }
        productQuantities[productId].totalQuantity += quantity;

         // Sum total value ordered
        if (!productValues[productId]) {
             productValues[productId] = { id: productId, name: productName, totalValue: 0 };
        }
        productValues[productId].totalValue += value;
    });

    // Sort and take top 5
    const topByFrequency = Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const topByQuantity = Object.values(productQuantities)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 5);

     const topByValue = Object.values(productValues)
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5);


    // --- Inventory Summary Count ---
     const { count: totalActiveProductsCount, error: invCountError } = await supabase
      .from("products")
      .select('*', { count: "exact", head: true }) // Get count only
      .eq("is_active", true);

    if (invCountError) throw invCountError;
    const totalActiveProducts = totalActiveProductsCount ?? 0;


    // --- Estimated Inventory Value (Corrected Logic) ---
    let estimatedInventoryValue = 0; // Initialize

    // 1. Get active products currently in stock
    const { data: activeProducts, error: invProdError } = await supabase
        .from('products')
        .select('productid, current_stock') // Select ID and stock
        .eq('is_active', true)
        .gt('current_stock', 0); // Only products with stock > 0

    if (invProdError) throw invProdError;

    if (activeProducts && activeProducts.length > 0) {
        const productIdsInStock = activeProducts.map(p => p.productid);

        // 2. Get the delivered purchase prices for these products (WITHOUT DB sorting)
        const { data: priceDetails, error: priceError } = await supabase
            .from('order_detail')
            .select(`
                productid,
                unit_price,
                orders!inner (delivered_date) // Keep the join
            `)
            .in('productid', productIdsInStock)
            .eq('orders.order_status', 'delivered')
            .not('orders.delivered_date', 'is', null); // Keep filters

        if (priceError) throw priceError;

        // --- START: Added JavaScript Sorting ---
        // Sort the price details in JavaScript AFTER fetching
        const sortedPriceDetails = (priceDetails || []).sort((a, b) => {
            // Handle potential null dates safely, treating nulls as older
            const dateA = a.orders?.delivered_date ? new Date(a.orders.delivered_date).getTime() : 0;
            const dateB = b.orders?.delivered_date ? new Date(b.orders.delivered_date).getTime() : 0;
            // Sort descending (latest date first)
            return dateB - dateA;
        });
        // --- END: Added JavaScript Sorting ---

        // 3. Create a map of product ID to its latest cost (using the sorted array)
        const latestCosts = {};
        // Iterate the SORTED array now
        sortedPriceDetails.forEach(detail => {
            // Since we sorted by date descending, the first price we see for a product is the latest
            // Ensure productid exists before trying to add to the map
            if (detail.productid && !latestCosts[detail.productid]) {
                latestCosts[detail.productid] = detail.unit_price || 0; // Use the unit price, default 0
            }
        });

        // 4. Calculate total value using the latest cost found
        estimatedInventoryValue = activeProducts.reduce((sum, product) => {
            const cost = latestCosts[product.productid] || 0; // Get latest cost
            const stock = product.current_stock || 0;
            return sum + (stock * cost);
        }, 0);
    }
    // If activeProducts is empty or null, estimatedInventoryValue remains 0


    // --- Combine all stats ---
    const summaryData = {
      totalDeliveredOrders,
      totalDeliveredValue,
      totalActiveProducts,
      estimatedInventoryValue, // Use the calculated value
      topProductsByFrequency: topByFrequency,
      topProductsByQuantity: topByQuantity,
      topProductsByValue: topByValue,
    };

    res.json(summaryData);

  } catch (error) {
    console.error("Error fetching report summary:", error);
    // Send back the specific message from the caught error
    res.status(500).json({ error: "Failed to generate report summary.", details: error.message });
  }
});


// --- NEW: GET /api/reports/monthly-top-products ---
// Fetches top N products ordered within a specific month and year
router.get("/monthly-top-products", authenticateToken, /* Optional: isAdmin, */ async (req, res) => {
    const { year, month, limit = 5 } = req.query; // Default limit to 5

    // --- Validation ---
    const currentYear = new Date().getFullYear();
    const reportYear = parseInt(year, 10);
    const reportMonth = parseInt(month, 10); // Month is 1-12
    const reportLimit = parseInt(limit, 10);

    if (isNaN(reportYear) || reportYear < 2000 || reportYear > currentYear + 1) {
        return res.status(400).json({ error: "Invalid or missing 'year' parameter." });
    }
    if (isNaN(reportMonth) || reportMonth < 1 || reportMonth > 12) {
        return res.status(400).json({ error: "Invalid or missing 'month' parameter (1-12)." });
    }
     if (isNaN(reportLimit) || reportLimit <= 0) {
        return res.status(400).json({ error: "Invalid 'limit' parameter." });
    }

    try {
        // --- Calculate Date Range for the Query ---
        // Start of the month (YYYY-MM-01)
        const startDate = `${reportYear}-${String(reportMonth).padStart(2, '0')}-01`;
        // Start of the *next* month
        const nextMonth = reportMonth === 12 ? 1 : reportMonth + 1;
        const nextYear = reportMonth === 12 ? reportYear + 1 : reportYear;
        const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        console.log(`Querying top products for range: >= ${startDate} and < ${endDate}`);

        // --- Fetch Order Details within the Date Range ---
        const { data: monthlyOrderDetails, error: detailsError } = await supabase
            .from('order_detail')
            .select(`
                productid,
                products!inner (product_name),
                orders!inner (order_date)
            `)
            .gte('orders.order_date', startDate) // Greater than or equal to start date
            .lt('orders.order_date', endDate)    // Less than end date (exclusive)
            // Optionally filter by order status if needed, e.g., only count 'delivered'
            // .eq('orders.order_status', 'delivered')

        if (detailsError) throw detailsError;

        // --- Process Results in Node.js to Count Frequencies ---
        const productFrequency = {};
        (monthlyOrderDetails || []).forEach(detail => {
            if (!detail.products || !detail.productid) return; // Skip if product info is missing

            const productId = detail.productid;
            const productName = detail.products.product_name || `Product ID ${productId}`;

            if (!productFrequency[productId]) {
                productFrequency[productId] = { id: productId, name: productName, count: 0 };
            }
            productFrequency[productId].count += 1; // Count each line item occurrence
        });

        // --- Sort and Limit ---
        const sortedProducts = Object.values(productFrequency)
            .sort((a, b) => b.count - a.count) // Sort by count descending
            .slice(0, reportLimit); // Take the top N

        res.json(sortedProducts);

    } catch (error) {
        console.error(`Error fetching monthly top products for ${year}-${month}:`, error);
        res.status(500).json({ error: "Failed to generate monthly top products report.", details: error.message });
    }
});


module.exports = router; // Make sure this is at the end