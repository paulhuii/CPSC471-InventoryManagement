import React, { createContext, useContext, useState } from "react";

const OrderCartContext = createContext();

export const useOrderCart = () => useContext(OrderCartContext);

export function createOrderItemFromProduct(product) {
  const quantity = product.min_quantity - product.current_stock;
  const price = parseFloat(product.case_price);

  return {
    productid: product.productid,
    product_name: product.product_name || "",
    requested_quantity: isNaN(quantity) ? 0 : quantity,
    unit_price: isNaN(price) ? 0 : price,
    supplierid: product.supplierid,
    supplier_name:
      product.supplier?.supplier_name || product.supplier_name || "",
  };
}

export const OrderCartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    const alreadyExists = cartItems.find(
      (item) => item.productid === product.productid
    );
    if (alreadyExists) return;

    const newItem = createOrderItemFromProduct(product);
    setCartItems((prev) => [...prev, newItem]);
    console.log("Added to cart:", newItem);
  };

  const removeItem = (productid) => {
    setCartItems((prev) => prev.filter((item) => item.productid !== productid));
  };

  const clearCart = () => setCartItems([]);

  return (
    <OrderCartContext.Provider
      value={{ cartItems, addToCart, removeItem, clearCart }}
    >
      {children}
    </OrderCartContext.Provider>
  );
};
