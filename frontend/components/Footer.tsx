import Link from "next/link";
import { Logo } from "./Header";

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div className="space-y-3"><Logo light /><p className="text-sm text-gray-400">Marketplace multi-vendeurs et livraison de repas. Projet académique.</p></div>
        <div><h4 className="text-gold-champagne font-semibold mb-3">Découvrir</h4><ul className="space-y-2 text-sm"><li><Link href="/products" className="hover:text-white">Boutique</Link></li><li><Link href="/restaurants" className="hover:text-white">Restaurants</Link></li><li><Link href="/orders" className="hover:text-white">Mes commandes</Link></li></ul></div>
        <div><h4 className="text-gold-champagne font-semibold mb-3">Travailler avec nous</h4><ul className="space-y-2 text-sm"><li><Link href="/register" className="hover:text-white">Devenir vendeur</Link></li><li><Link href="/register" className="hover:text-white">Ouvrir un restaurant</Link></li><li><Link href="/register" className="hover:text-white">Devenir livreur</Link></li></ul></div>
        <div><h4 className="text-gold-champagne font-semibold mb-3">À propos</h4><p className="text-sm text-gray-400">Paiements et transporteurs <b>simulés</b> à des fins pédagogiques. Aucune donnée bancaire réelle.</p></div>
      </div>
      <div className="border-t border-white/10 text-center text-xs text-gray-500 py-4">© 2026 SILA — Shop. Eat. Discover.</div>
    </footer>
  );
}
