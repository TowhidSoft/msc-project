"use client";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, paymentsApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { ClipboardList, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  user_id: number;
  book_id: number;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  COMPLETED: { label: "Completed", badge: "badge-green", icon: <CheckCircle size={14} /> },
  CANCELLED: { label: "Cancelled", badge: "badge-red", icon: <XCircle size={14} /> },
  PENDING:   { label: "Processing", badge: "badge-yellow", icon: <Clock size={14} /> },
};

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.getOrders().then((r) => r.data as Order[]),
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <div className="page-enter">
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "8px" }}>
            <span className="gradient-text">My Orders</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "36px" }}>Track your order history and payment status</p>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: "88px", borderRadius: "16px" }} />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
              <ClipboardList size={56} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
              <p style={{ fontSize: "1.1rem", marginBottom: "24px" }}>No orders yet</p>
              <Link href="/" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", padding: "12px 28px" }}>
                Browse Books
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[...orders].reverse().map((order) => {
                const cfg = statusConfig[order.status] || statusConfig.PENDING;
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="glass-card"
                      style={{
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        cursor: "pointer",
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "4px", color: "var(--text-primary)" }}>
                          Order #{order.id}
                        </p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.825rem" }}>
                          Book #{order.book_id} · Qty {order.quantity} · {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
                        <p style={{ fontWeight: 700, fontSize: "1rem" }}>${order.total_price.toFixed(2)}</p>
                        <span className={`badge ${cfg.badge}`} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <ChevronRight size={16} style={{ color: "var(--text-secondary)" }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
