import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "IronLog — Track. Progress. Dominate.",
  description: "The minimalist workout tracker built for progressive overload.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-black text-white`}>
        <div className="fixed inset-0 -z-10 overflow-hidden">

          {/* Blue aura */}
          <div className="aura aura1"></div>
          <div className="aura aura2"></div>

          {/* Stars */}
          <div className="stars"></div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}