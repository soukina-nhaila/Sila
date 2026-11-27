import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toaster from "@/components/Toaster";

export const metadata: Metadata = { title: "SILA — Shop. Eat. Discover.", description: "Marketplace multi-vendeurs et livraison de repas" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-sans">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8 min-h-[70vh]">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
