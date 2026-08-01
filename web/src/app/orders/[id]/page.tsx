"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, paymentsApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { ArrowLeft, CheckCircle, XCircle, Clock, CreditCard, Package, Calendar } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  user_id: number;
  book_id: number;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: number;
  order_id: string;
  user_id: number;
  amount: number;
  transaction_id: string;
  status: string;
  created_at: string;
}

const statusIcons: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle size={20} color="#10b981" />,
  CANCELLED: <XCircle size={20} color="#ef4444" />,
  PENDING:   <Clock size={20} color="#f59e0b" />,
};
const statusBadge: Record<string, string> = {
  COMPLETED: "badge-green",
  CANCELLED: "badge-red",
  PENDING:   "badge-yellow",
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.getOrder(id).then((r) => r.data as Order),
  });

  const { data: payment } = useQuery({
    queryKey: ["payment", id],
    queryFn: () => paymentsApi.getByOrder(id).then((r) => r.data as Payment),
    enabled: !!order,
    retry: false,
  });

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 24px" }}>
        <Link href="/orders" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "32px", fontSize: "0.9rem" }}>
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        {orderLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[160, 200, 200].map((h, i) => (
              <div key={i} className="skeleton" style={{ height: `${h}px`, borderRadius: "16px" }} />
            ))}
          </div>
        ) : !order ? (
          <p style={{ color: "var(--text-secondary)" }}>Order not found.</p>
        ) : (
          <div className="page-enter" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Order header */}
            <div className="glass-card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "6px" }}>Order #{order.id}</h1>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    Placed on {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`badge ${statusBadge[order.status] || "badge-yellow"}`} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", padding: "6px 14px" }}>
                  {statusIcons[order.status]}
                  {order.status}
                </span>
              </div>

              {/* Saga progress */}
              <div style={{ display: "flex", gap: "0", alignItems: "center" }}>
                {["ORDER PLACED", "STOCK RESERVED", "PAYMENT", "FULFILLED"].map((step, i) => {
                  const done =
                    order.status === "COMPLETED"
                      ? true
                      : order.status === "PENDING" && i === 0;
                  return (
                    <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                        {i > 0 && <div style={{ flex: 1, height: "2px", background: done ? "var(--accent)" : "var(--border)" }} />}
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                          background: done ? "var(--accent)" : "var(--bg-card)",
                          border: `2px solid ${done ? "var(--accent)" : "var(--border)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {done && <CheckCircle size={14} color="white" />}
                        </div>
                        {i < 3 && <div style={{ flex: 1, height: "2px", background: order.status === "COMPLETED" ? "var(--accent)" : "var(--border)" }} />}
                      </div>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", marginTop: "6px", textAlign: "center", fontWeight: 500 }}>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order items */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Package size={18} /> Order Items
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-secondary)" }}>Book #{order.book_id}</span>
                <span>×{order.quantity}</span>
                <span style={{ fontWeight: 700 }}>${order.total_price.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", fontWeight: 700, fontSize: "1.1rem" }}>
                <span>Total</span>
                <span style={{ color: "var(--accent-light)" }}>${order.total_price.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <CreditCard size={18} /> Payment Details
              </h3>
              {payment ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Status</span>
                    <span className={`badge ${payment.status === "SUCCESS" ? "badge-green" : "badge-red"}`}>{payment.status}</span>
                  </div>
                  {payment.transaction_id && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)" }}>Transaction ID</span>
                      <span style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>{payment.transaction_id}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Amount</span>
                    <span style={{ fontWeight: 700 }}>${payment.amount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Date</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={13} />
                      {new Date(payment.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  Payment is being processed asynchronously via the Saga workflow…
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
