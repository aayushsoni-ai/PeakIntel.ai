"use client";

import React, { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import Providers from "./providers";
import { Sidebar } from "../components/Sidebar";
import { useAuthStore } from "../store/authStore";
import LandingPage from "./landing/page";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased relative">
        <Providers>
          {!mounted ? (
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : !isAuthenticated || pathname === "/landing" ? (
            <LandingPage />
          ) : (
            <div className="min-h-screen flex flex-col lg:flex-row relative">
              {/* Mobile Header */}
              <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar sticky top-0 z-50">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="PeakIntel AI" className="w-8 h-8 object-contain" />
                  <span className="font-bold text-sm">PeakIntel AI</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-sidebar-accent rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Sidebar Drawer Container */}
              <div
                className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300 ${
                  sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setSidebarOpen(false)}
              />

              <Sidebar
                className={`fixed inset-y-0 left-0 z-[70] lg:relative lg:translate-x-0 transition-transform duration-300 ${
                  sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                onClose={() => setSidebarOpen(false)}
              />

              <main className="flex-1 overflow-auto min-w-0">
                <div className="max-w-[1600px] mx-auto p-4 md:p-6">{children}</div>
              </main>
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
