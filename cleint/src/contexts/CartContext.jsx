// src/contexts/CartContext.jsx
import { createContext, useContext, useMemo, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { notify } from "../components/Notifications.jsx";
import api from "../api";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]); // {key, product, variation, qty}

  const guard = () => {
    if (!user) {
      notify?.error?.("Please login to add items");
      return false;
    }
    if (user.role === "admin") {
      notify?.error?.("Admins cannot add to cart");
      return false;
    }
    return true;
  };

  const addToCart = (product, variation, qty = 1) => {
    if (!guard()) return;
    if (!variation?.color || !variation?.size) {
      notify?.info?.("Choose color & size first");
      return;
    }
    const key = `${product.product_id}-${variation.color}-${variation.size}`;
    setItems((prev) => {
      const exist = prev.find((i) => i.key === key);
      if (exist)
        return prev.map((i) =>
          i.key === key ? { ...i, qty: i.qty + qty } : i
        );
      return [...prev, { key, product, variation, qty }];
    });
    notify?.success?.("Added to cart");
  };

  const removeFromCart = (key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
    notify?.info?.("Removed from cart");
  };
  const clearCart = () => {
    setItems([]);
    notify?.info?.("Cart cleared");
  };

  const total = useMemo(
    () =>
      items.reduce((s, i) => s + i.qty * Number(i.variation?.price || 0), 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((s, i) => s + Number(i.qty || 0), 0),
    [items]
  );

  const checkout = async () => {
    if (!guard()) return Promise.reject(new Error("Not allowed"));
    const payloadItems = items.map(({ product, variation, qty }) => ({
      product_id: product.product_id,
      color: variation.color,
      size: variation.size,
      quantity: qty,
    }));
    const { data } = await api.post("/orders", {
      user_id: user.user_id,
      items: payloadItems,
    });
    clearCart();
    notify?.success?.(`Order placed! #${data.order_id}`);
    return data;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        total,
        itemCount,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
