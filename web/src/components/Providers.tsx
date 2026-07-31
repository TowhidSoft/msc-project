"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1a1a26",
            color: "#f0f0ff",
            border: "1px solid #2a2a40",
            borderRadius: "12px",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#1a1a26" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#1a1a26" } },
        }}
      />
    </QueryClientProvider>
  );
}
