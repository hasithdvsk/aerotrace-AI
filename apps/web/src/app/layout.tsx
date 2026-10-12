import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/animations/SmoothScrollProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html
      lang="en"
      className={`dark h-full antialiased ${plusJakartaSans.variable} ${jetbrainsMono.variable} font-sans`}
    >
      <body className="min-h-full flex flex-col bg-[#030712] font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}


