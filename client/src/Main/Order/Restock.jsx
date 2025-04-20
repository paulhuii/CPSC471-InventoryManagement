import React, { useEffect, useState } from "react";
import { getInventory } from "../../api";
import { useOrderCart } from "../OrderCartContext";

const getStatusColor = (stock, min) => {
  if (stock == 0) return "red";
  if (stock < min) return "yellow";
  return "green";
};

const getColorClass = (color) => {
  switch (color) {
    case "red":
      return "bg-red-300";
    case "yellow":
      return "bg-yellow-200";
    case "green":
      return "bg-green-300";
    default:
      return "";
  }
};

const sectionTitles = {
  red: "Out of Stock",
  yellow: "Low Stock",
  green: "In Stock",
};

const OrderRestock = () => {
  const { addToCart } = useOrderCart();
  const [grouped, setGrouped] = useState({ red: [], yellow: [], green: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getInventory();
        const groupedData = { red: [], yellow: [], green: [] };

        data.forEach((item) => {
          const color = getStatusColor(item.current_stock, item.min_quantity);
          groupedData[color].push(item);
        });

        setGrouped(groupedData);
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
      }
    };

    fetchData();
  }, []);

  const renderScrollableRow = (items, color) => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">{sectionTitles[color]}</h2>
      <div className="flex overflow-x-auto space-x-4 pb-4">
        {items.map((item) => {
          const restockQty = item.min_quantity - item.current_stock;

          return (
            <div
              key={item.productid}
              className={`min-w-[200px] rounded-xl p-4 shadow-md shrink-0 ${getColorClass(
                color
              )}`}
            >
              <h2 className="font-semibold text-md">{item.product_name}</h2>
              <p className="text-sm">
                {item.current_stock} in stock
                <br />
                Min: {item.min_quantity}
              </p>
              <button
                className="mt-2 bg-white px-4 py-1 rounded border shadow text-sm hover:bg-gray-100"
                onClick={() => {
                  console.log("🧪 Adding item:", item);

                  const supplierName =
                    item.supplier?.supplier_name ||
                    item.supplier_name ||
                    "Unknown Supplier";

                  const hasRequiredFields =
                    item.case_price !== undefined &&
                    item.min_quantity !== undefined &&
                    item.current_stock !== undefined;

                  if (hasRequiredFields) {
                    addToCart({
                      ...item,
                      supplier_name: supplierName,
                    });
                    alert(`${item.product_name} added to order list!`);
                  } else {
                    console.warn("❌ Missing product fields:", item);
                    alert("This item is missing data and cannot be added.");
                  }
                }}
                disabled={restockQty <= 0}
              >
                Restock Now
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {renderScrollableRow(grouped.red, "red")}
      {renderScrollableRow(grouped.yellow, "yellow")}
      {renderScrollableRow(grouped.green, "green")}
    </div>
  );
};

export default OrderRestock;
