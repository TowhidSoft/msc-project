import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://89.116.122.90:7000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 responses
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/login", data),
  me: () => api.get("/me"),
};

// ─── CATALOG ─────────────────────────────────────────────
export const catalogApi = {
  getBooks: (params?: { category?: string; search?: string }) =>
    api.get("/books", { params }),
  getBook: (id: number) => api.get(`/books/${id}`),
};

// ─── INVENTORY ───────────────────────────────────────────
export const inventoryApi = {
  getAll: () => api.get("/inventory"),
  getStock: (bookId: number) => api.get(`/inventory/${bookId}`),
  restock: (bookId: number, quantity: number) =>
    api.post("/inventory/restock", { book_id: bookId, quantity }),
};

// ─── ORDERS ──────────────────────────────────────────────
export const ordersApi = {
  createOrder: (data: { user_id: number; book_id: number; quantity: number }) =>
    api.post("/orders", data),
  getOrders: () => api.get("/orders"),
  getOrder: (id: string) => api.get(`/orders/${id}`),
};

// ─── PAYMENTS ────────────────────────────────────────────
export const paymentsApi = {
  getAll: () => api.get("/payments"),
  getByOrder: (orderId: string) => api.get(`/payments/${orderId}`),
};
