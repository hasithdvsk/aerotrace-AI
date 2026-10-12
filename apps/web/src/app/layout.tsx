import type { Metadata } from "next";
import "./globals.css";
import SmoothScrollProvider from "@/components/animations/SmoothScrollProvider";

export const metadata: Metadata = {
  title: "AetherGrid | Hyperlocal AQI & Satellite Environmental Platform",
  description: "Next.js App Router platform powered by PostGIS spatial grids, TimescaleDB IoT telemetry, and Sentinel-5P satellite macro atmospheric fusion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#090d16] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}

