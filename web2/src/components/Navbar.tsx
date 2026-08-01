"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import {
  BookOpen,
  ShoppingCart,
  LogOut,
  User,
  Package,
  LayoutDashboard,
  ClipboardList,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = !!token;
  
  const totalItems = useCartStore((s) => s.totalItems());

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully");
    router.push("/login");
  };

  const navLinks = [
    { href: "/", label: "Catalog", icon: BookOpen },
    { href: "/orders", label: "My Orders", icon: ClipboardList },
    ...(user?.role === "admin"
      ? [
        { href: "/admin/inventory", label: "Inventory", icon: Package },
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ]
      : []),
  ];

  return (
    <nav
      style={{
        background: "rgba(18,18,26,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={20} color="white" />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            BookStore
          </span>
        </Link>

        {/* Nav links */}
        {mounted && isAuthenticated && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color:
                    pathname === href
                      ? "var(--accent-light)"
                      : "var(--text-secondary)",
                  background:
                    pathname === href
                      ? "rgba(124,58,237,0.15)"
                      : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {!mounted ? null : isAuthenticated ? (
            <>
              {/* Cart */}
              <Link
                href="/cart"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <ShoppingCart size={18} />
                {totalItems > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-6px",
                      background: "var(--accent)",
                      color: "white",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      borderRadius: "999px",
                      padding: "2px 6px",
                      minWidth: "18px",
                      textAlign: "center",
                    }}
                  >
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  borderRadius: "10px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={14} color="white" />
                </div>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                    fontWeight: 500,
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user?.name || user?.email}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost" style={{ textDecoration: "none", fontSize: "0.9rem" }}>
                Login
              </Link>
              <Link href="/register" className="btn-primary" style={{ textDecoration: "none", fontSize: "0.9rem" }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
