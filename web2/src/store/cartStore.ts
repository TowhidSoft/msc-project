import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  bookId: number;
  title: string;
  author: string;
  price: number;
  quantity: number;
  cover?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (bookId: number) => void;
  updateQty: (bookId: number, qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.bookId === item.bookId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.bookId === item.bookId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (bookId) =>
        set({ items: get().items.filter((i) => i.bookId !== bookId) }),
      updateQty: (bookId, qty) =>
        set({
          items: get().items.map((i) =>
            i.bookId === bookId ? { ...i, quantity: qty } : i
          ),
        }),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: () =>
        get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    { name: "cart-storage" }
  )
);
