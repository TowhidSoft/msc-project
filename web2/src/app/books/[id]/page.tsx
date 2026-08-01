"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import Navbar from "@/components/Navbar";
import { BookOpen, ShoppingCart, ArrowLeft, Star, Tag } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  price: number;
  description: string;
  isbn: string;
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const addItem = useCartStore((s) => s.addItem);

  const { data: book, isLoading, isError } = useQuery({
    queryKey: ["book", id],
    queryFn: () => catalogApi.getBook(Number(id)).then((r) => r.data as Book),
  });

  const handleAddToCart = () => {
    if (!book) return;
    addItem({ bookId: book.id, title: book.title, author: book.author, price: book.price, quantity: 1 });
    toast.success(`"${book.title}" added to cart`);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "32px", fontSize: "0.9rem" }}
        >
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "40px" }}>
            <div className="skeleton" style={{ height: "380px", borderRadius: "16px" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[200, 120, 80, 80, 200].map((h, i) => (
                <div key={i} className="skeleton" style={{ height: `${h}px`, borderRadius: "12px" }} />
              ))}
            </div>
          </div>
        ) : isError || !book ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-secondary)" }}>
            <BookOpen size={48} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
            <p>Book not found.</p>
          </div>
        ) : (
          <div className="page-enter" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "40px" }}>
            {/* Book cover */}
            <div>
              <div
                style={{
                  height: "380px", borderRadius: "16px",
                  background: `linear-gradient(135deg, hsl(${(book.id * 60) % 360},60%,25%), hsl(${(book.id * 60 + 40) % 360},70%,15%))`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                }}
              >
                <BookOpen size={70} color="rgba(255,255,255,0.35)" />
              </div>
            </div>

            {/* Book details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: "12px" }}>{book.category}</span>
                <h1 style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.2, marginBottom: "8px" }}>{book.title}</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>by <strong style={{ color: "var(--text-primary)" }}>{book.author}</strong></p>
              </div>

              {/* Rating */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < 4 ? "#f59e0b" : "none"} stroke="#f59e0b" />
                  ))}
                </div>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>4.0 · 128 reviews</span>
              </div>

              {/* ISBN */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                <Tag size={14} />
                <span>ISBN: {book.isbn}</span>
              </div>

              {/* Description */}
              <div className="glass-card" style={{ padding: "20px" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>About this book</h3>
                <p style={{ color: "var(--text-primary)", lineHeight: 1.7, fontSize: "0.95rem" }}>{book.description}</p>
              </div>

              {/* Price & CTA */}
              <div
                className="glass-card"
                style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}
              >
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "4px" }}>Price</p>
                  <p style={{ fontSize: "2rem", fontWeight: 700 }}>${book.price.toFixed(2)}</p>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleAddToCart}
                  style={{ padding: "14px 28px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
