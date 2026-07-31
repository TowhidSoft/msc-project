"use client";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, paymentsApi, inventoryApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { BarChart2, ShoppingBag, CreditCard, Package, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
}

interface Payment {
  id: number;
  status: string;
  amount: number;
}

interface InventoryItem {
  book_id: number;
  stock: number;
}

export default function AdminDashboardPage() {
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => ordersApi.getOrders().then((r) => r.data as Order[]),
  });
  const { data: payments } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => paymentsApi.getAll().then((r) => r.data as Payment[]),
  });
  const { data: inventory } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: () => inventoryApi.getAll().then((r) => r.data as InventoryItem[]),
  });

  const totalRevenue = payments?.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0) ?? 0;
  const completedOrders = orders?.filter((o) => o.status === "COMPLETED").length ?? 0;
  const cancelledOrders = orders?.filter((o) => o.status === "CANCELLED").length ?? 0;
  const pendingOrders = orders?.filter((o) => o.status === "PENDING").length ?? 0;
  const totalStock = inventory?.reduce((s, i) => s + i.stock, 0) ?? 0;

  const stats = [
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: <TrendingUp size={22} />, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    { label: "Total Orders", value: orders?.length ?? 0, icon: <ShoppingBag size={22} />, color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
    { label: "Payments Processed", value: payments?.length ?? 0, icon: <CreditCard size={22} />, color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
    { label: "Units in Stock", value: totalStock, icon: <Package size={22} />, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  ];

  // Simple bar chart data
  const ordersByStatus = [
    { label: "Completed", count: completedOrders, color: "#10b981", icon: <CheckCircle size={14} /> },
    { label: "Cancelled", count: cancelledOrders, color: "#ef4444", icon: <XCircle size={14} /> },
    { label: "Pending", count: pendingOrders, color: "#f59e0b", icon: <Clock size={14} /> },
  ];
  const maxCount = Math.max(...ordersByStatus.map((o) => o.count), 1);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
        <div className="page-enter">
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            <span className="gradient-text">Admin Dashboard</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "36px" }}>
            Real-time overview of the microservices ecosystem
          </p>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "16px", marginBottom: "36px" }}>
            {stats.map(({ label, value, icon, color, bg }) => (
              <div key={label} className="glass-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                    <p style={{ fontSize: "2rem", fontWeight: 800, color }}>{value}</p>
                  </div>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
                    {icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Order status chart */}
            <div className="glass-card" style={{ padding: "28px" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
                <BarChart2 size={18} /> Order Status Breakdown
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {ordersByStatus.map(({ label, count, color, icon }) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.875rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                        <span style={{ color }}>{icon}</span> {label}
                      </span>
                      <span style={{ fontWeight: 700, color }}>{count}</span>
                    </div>
                    <div style={{ height: "8px", borderRadius: "4px", background: "var(--border)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${(count / maxCount) * 100}%`,
                          background: color,
                          borderRadius: "4px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent orders */}
            <div className="glass-card" style={{ padding: "28px" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShoppingBag size={18} /> Recent Orders
              </h3>
              {!orders || orders.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>No orders yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[...orders].reverse().slice(0, 6).map((order) => (
                    <div key={order.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>#{order.id.slice(0, 14)}…</p>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>${order.total_price.toFixed(2)}</span>
                        <span className={`badge ${order.status === "COMPLETED" ? "badge-green" : order.status === "CANCELLED" ? "badge-red" : "badge-yellow"}`} style={{ fontSize: "0.7rem" }}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
