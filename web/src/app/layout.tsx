import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "BookStore — Cloud-Native E-Commerce",
  description:
    "A microservices-powered e-commerce platform for discovering and ordering books. Built with Go, Next.js, and Kubernetes.",
  keywords: ["books", "e-commerce", "microservices", "bookstore"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="animated-bg" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
