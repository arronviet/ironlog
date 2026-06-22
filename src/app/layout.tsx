import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IronLog — Track. Progress. Dominate.",
  description:
    "The minimalist workout tracker built for progressive overload. No noise, just gains.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} antialiased bg-black text-white overflow-x-hidden`}
      >
        {/* Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">

          {/* Goku */}
          <img
            src="/goku-bg.jpg"
            alt=""
            className="
              absolute right-0 bottom-0
              h-full object-cover
              opacity-[0.08]
              blur-[1px]
              pointer-events-none
              select-none
            "
          />

          {/* Ultra Instinct aura */}
          <div
            className="
              absolute right-[-150px]
              bottom-[-150px]
              w-[900px]
              h-[900px]
              rounded-full
              bg-cyan-400/10
              blur-[220px]
            "
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/85" />
        </div>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}