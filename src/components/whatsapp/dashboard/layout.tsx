"use client";

import { Sidebar } from "./sidebar";
import { Toaster } from "@/components/whatsapp/ui/toaster";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileSidebarOpen(true);
    window.addEventListener("toggle-mobile-sidebar", handler);
    return () => window.removeEventListener("toggle-mobile-sidebar", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <main className="lg:pl-64">
        {children}
      </main>

      <Toaster />
    </div>
  );
}