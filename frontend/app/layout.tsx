import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = { title: "SILA — Shop. Eat. Discover.", description: "Marketplace multi-vendeurs et livraison de repas" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-6 min-h-[70vh]">{children}</main>
        <footer className="bg-brand-dark text-gold-champagne text-center text-sm py-6 mt-10">
          SILA — Shop. Eat. Discover. · Projet académique · Paiements et transporteurs simulés
        </footer>
      </body>
    </html>
  );
}
