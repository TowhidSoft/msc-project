"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { Package, Plus, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface InventoryItem {
  book_id: number;
  stock: number;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [restockBookId, setRestockBookId] = useState("");
  const [restockQty, setRestockQty] = useState("");

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryApi.getAll().then((r) => r.data as InventoryItem[]),
  });

  const restockMutation = useMutation({
    mutationFn: ({ bookId, qty }: { bookId: number; qty: number }) =>
      inventoryApi.restock(bookId, qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Stock updated successfully");
      setRestockBookId("");
      setRestockQty("");
    },
    onError: () => toast.error("Failed to update stock"),
  });

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    const bookId = parseInt(restockBookId);
    const qty = parseInt(restockQty);
    if (isNaN(bookId) || isNaN(qty) || qty < 1) {
      toast.error("Enter valid Book ID and quantity (min 1)");
      return;
    }
    restockMutation.mutate({ bookId, qty });
  };

  const totalStock = inventory?.reduce((s, i) => s + i.stock, 0) ?? 0;
  const lowStockItems = inventory?.filter((i) => i.stock <= 3) ?? [];

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
        <div className="page-enter">
          <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>
            <span className="gradient-text">Inventory Management</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "36px" }}>
            Monitor and manage stock levels across all books
          </p>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "16px", marginBottom: "36px" }}>
            {[
              { label: "Total Books", value: inventory?.length ?? 0, icon: <Package size={20} />, color: "#7c3aed" },
              { label: "Total Stock", value: totalStock, icon: <TrendingUp size={20} />, color: "#10b981" },
              { label: "Low Stock Alerts", value: lowStockItems.length, icon: <AlertTriangle size={20} />, color: "#f59e0b" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
                    {icon}
                  </div>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>{label}</span>
                </div>
                <p style={{ fontSize: "2rem", fontWeight: 800 }}>{value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>
            {/* Inventory table */}
            <div className="glass-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ fontWeight: 700 }}>Stock Levels</h3>
              </div>
              {isLoading ? (
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: "52px", borderRadius: "8px" }} />
                  ))}
                </div>
              ) : (
                <div>
                  {/* Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 120px 100px", padding: "12px 24px", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>
                    <span>Book ID</span><span>Status</span><span>Stock</span><span>Indicator</span>
                  </div>
                  {inventory?.map((item) => {
                    const low = item.stock <= 3;
                    const ok = item.stock > 10;
                    return (
                      <div key={item.book_id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 120px 100px", padding: "14px 24px", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, color: "var(--accent-light)" }}>#{item.book_id}</span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                          {low ? "⚠️ Low Stock" : ok ? "In Stock" : "Moderate"}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: "1rem" }}>{item.stock} units</span>
                        <div>
                          <div style={{ height: "6px", borderRadius: "3px", background: "var(--border)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min((item.stock / 20) * 100, 100)}%`, background: low ? "#ef4444" : ok ? "#10b981" : "#f59e0b", borderRadius: "3px", transition: "width 0.3s ease" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Restock form */}
            <div className="glass-card" style={{ padding: "24px", position: "sticky", top: "80px" }}>
              <h3 style={{ fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} /> Restock Books
              </h3>
              <form onSubmit={handleRestock} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>Book ID</label>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    value={restockBookId}
                    onChange={(e) => setRestockBookId(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>Quantity to Add</label>
                  <input
                    className="input-field"
                    type="number"
                    min="1"
                    placeholder="e.g. 20"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={restockMutation.isPending}
                  style={{ width: "100%", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  {restockMutation.isPending ? "Updating…" : (
                    <><CheckCircle size={16} /> Update Stock</>
                  )}
                </button>
              </form>

              {/* Low stock alerts */}
              {lowStockItems.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 600, color: "#f59e0b", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ⚠️ Low Stock Alerts
                  </h4>
                  {lowStockItems.map((item) => (
                    <div
                      key={item.book_id}
                      style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "8px", background: "rgba(245,158,11,0.1)", marginBottom: "6px", fontSize: "0.875rem" }}
                    >
                      <span style={{ color: "var(--text-secondary)" }}>Book #{item.book_id}</span>
                      <span style={{ color: "#f59e0b", fontWeight: 600 }}>{item.stock} left</span>
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
