"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import Navbar from "@/components/Navbar";
import { Search, Filter, ShoppingCart, Star, BookOpen } from "lucide-react";
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

const CATEGORIES = ["All", "Programming", "Science", "Mathematics", "History", "Fiction"];

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading } = useQuery({
    queryKey: ["books", search, category],
    queryFn: () =>
      catalogApi
        .getBooks({
          search: search || undefined,
          category: category === "All" ? undefined : category,
        })
        .then((r) => r.data as Book[]),
  });

  const handleAddToCart = (book: Book) => {
    addItem({
      bookId: book.id,
      title: book.title,
      author: book.author,
      price: book.price,
      quantity: 1,
    });
    toast.success(`"${book.title}" added to cart`);
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "48px" }} className="page-enter">
          <h1 style={{ fontSize: "2.8rem", fontWeight: 700, marginBottom: "12px", lineHeight: 1.2 }}>
            Discover Your Next{" "}
            <span className="gradient-text">Great Read</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "500px", margin: "0 auto" }}>
            Browse our curated collection of books across every genre
          </p>
        </div>

        {/* Search & Filter bar */}
        <div
          className="glass-card"
          style={{
            padding: "20px 24px",
            marginBottom: "36px",
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ flex: "1 1 260px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input
              className="input-field"
              style={{ paddingLeft: "42px" }}
              placeholder="Search by title, author, or keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <Filter size={15} style={{ color: "var(--text-secondary)" }} />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: category === cat ? "var(--accent)" : "var(--border)",
                  background: category === cat ? "rgba(124,58,237,0.2)" : "transparent",
                  color: category === cat ? "var(--accent-light)" : "var(--text-secondary)",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Book Grid */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "20px" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: "340px", borderRadius: "16px" }} />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-secondary)" }}>
            <BookOpen size={48} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
            <p style={{ fontSize: "1.1rem" }}>No books found matching your search.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "20px" }}>
            {data.map((book) => (
              <div
                key={book.id}
                className="glass-card"
                style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}
              >
                {/* Cover placeholder */}
                <div
                  style={{
                    height: "140px",
                    borderRadius: "12px",
                    background: `linear-gradient(135deg, hsl(${(book.id * 60) % 360},60%,25%), hsl(${(book.id * 60 + 40) % 360},70%,15%))`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "4px",
                  }}
                >
                  <BookOpen size={40} color="rgba(255,255,255,0.4)" />
                </div>

                {/* Category badge */}
                <span className="badge badge-purple" style={{ alignSelf: "flex-start" }}>
                  {book.category}
                </span>

                {/* Title */}
                <Link
                  href={`/books/${book.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      lineHeight: 1.3,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#a855f7")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  >
                    {book.title}
                  </h3>
                </Link>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  by {book.author}
                </p>

                {/* Stars */}
                <div style={{ display: "flex", gap: "3px" }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill={i < 4 ? "#f59e0b" : "none"} stroke="#f59e0b" />
                  ))}
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: "4px" }}>(4.0)</span>
                </div>

                {/* Price + CTA */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    ${book.price.toFixed(2)}
                  </span>
                  <button
                    className="btn-primary"
                    onClick={() => handleAddToCart(book)}
                    style={{ padding: "8px 16px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <ShoppingCart size={14} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
