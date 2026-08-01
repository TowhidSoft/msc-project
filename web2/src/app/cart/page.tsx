"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ordersApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from "lucide-react";
import toast from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQty, clearCart, totalPrice } = useCartStore();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isAuth = !!token;
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCheckout = async () => {
    if (!isAuth) {
      toast.error("Please sign in to place an order");
      router.push("/login");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setLoading(true);
    try {
      // Place one order per cart item (simplification — in production, batch via order-service)
      const promises = items.map((item) =>
        ordersApi.createOrder({
          user_id: user!.id,
          book_id: item.bookId,
          quantity: item.quantity,
        })
      );
      await Promise.all(promises);
      clearCart();
      toast.success("Orders placed! Processing via Saga workflow…");
      router.push("/orders");
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <div className="page-enter">
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "8px" }}>
            <span className="gradient-text">Shopping Cart</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "32px" }}>
            {!mounted ? "Loading..." : items.length === 0 ? "Your cart is empty" : `${items.length} item(s) in your cart`}
          </p>

          {!mounted ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ color: "var(--text-secondary)" }}>Loading cart...</p>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
              <ShoppingCart size={56} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
              <p style={{ fontSize: "1.1rem", marginBottom: "24px" }}>Your cart is empty</p>
              <button className="btn-primary" onClick={() => router.push("/")} style={{ padding: "12px 28px" }}>
                Browse Books
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>
              {/* Items list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {items.map((item) => (
                  <div
                    key={item.bookId}
                    className="glass-card"
                    style={{ padding: "20px", display: "flex", gap: "16px", alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: "64px", height: "80px", flexShrink: 0, borderRadius: "8px",
                        background: `linear-gradient(135deg, hsl(${(item.bookId * 60) % 360},60%,25%), hsl(${(item.bookId * 60 + 40) % 360},70%,15%))`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Package size={24} color="rgba(255,255,255,0.4)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontWeight: 600, marginBottom: "4px", fontSize: "0.95rem" }}>{item.title}</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.825rem" }}>by {item.author}</p>
                      <p style={{ color: "var(--accent-light)", fontWeight: 700, marginTop: "4px" }}>
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                    {/* Qty controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={() => item.quantity > 1 ? updateQty(item.bookId, item.quantity - 1) : removeItem(item.bookId)}
                        style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: 600, minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.bookId, item.quantity + 1)}
                        style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p style={{ fontWeight: 700, minWidth: "70px", textAlign: "right" }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => { removeItem(item.bookId); toast.success("Item removed"); }}
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "6px 8px", cursor: "pointer", color: "#ef4444", display: "flex" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Order summary */}
              <div className="glass-card" style={{ padding: "24px", position: "sticky", top: "80px" }}>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "20px" }}>Order Summary</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  {items.map((item) => (
                    <div key={item.bookId} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title} ×{item.quantity}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.1rem", marginBottom: "20px" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--accent-light)" }}>${totalPrice().toFixed(2)}</span>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleCheckout}
                  disabled={loading}
                  style={{ width: "100%", padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  {loading ? "Placing Orders…" : (
                    <>Place Order <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
