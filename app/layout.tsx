import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "QueueCure | Patient Queue Management",
  description: "A modern patient queue management system.",
};

import Link from "next/link";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <nav className="flex items-center gap-6 px-6 py-4 bg-white border-b border-slate-200 shadow-sm text-sm font-medium">
          <Link href="/" className="text-slate-900 font-bold hover:text-blue-600 transition-colors">QueueCure</Link>
          <div className="flex items-center gap-4 text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <Link href="/receptionist" className="hover:text-blue-600 transition-colors">Receptionist</Link>
            <Link href="/queue" className="hover:text-blue-600 transition-colors">Queue Display</Link>
          </div>
        </nav>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
