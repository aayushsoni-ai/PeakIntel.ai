import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "PeakIntel AI — Autonomous Financial Intelligence",
  description:
    "PeakIntel automates portfolio finance: ledger ingestion, EBITDA analysis, anomaly detection, and board pack generation in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen bg-background text-foreground antialiased relative">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
