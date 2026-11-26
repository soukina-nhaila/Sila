import Link from "next/link";
import { mad } from "@/lib/api";

export function Visual({ emoji, className = "" }: { emoji: string; className?: string }) {
  return <div className={`bg-gradient-to-br from-brand-light to-gold-champagne flex items-center justify-center rounded-xl ${className}`}><span className="text-6xl" aria-hidden>{emoji}</span></div>;
}

export function ProductCard({ p }: { p: any }) {
  return (
    <Link href={`/products/${p.id}`} className="card hover:shadow-lg transition block">
      <Visual emoji={p.emoji} className="h-36" />
      <h3 className="mt-3 font-semibold line-clamp-1">{p.title}</h3>
      <p className="text-xs text-gray-500">{p.brand} · ⭐ {p.rating_avg}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-bold text-brand">{mad(p.final_price)}</span>
        {p.discount_pct > 0 && <><span className="text-xs line-through text-gray-400">{mad(p.price)}</span><span className="text-xs bg-accent text-white rounded px-1">-{p.discount_pct}%</span></>}
      </div>
    </Link>
  );
}

export function RestaurantCard({ r }: { r: any }) {
  return (
    <Link href={`/restaurants/${r.id}`} className="card hover:shadow-lg transition block">
      <Visual emoji={r.emoji} className="h-32" />
      <h3 className="mt-3 font-semibold">{r.name}</h3>
      <p className="text-xs text-gray-500">{r.category} · ⭐ {r.rating_avg} · ~{r.prep_minutes + 15} min</p>
      <p className="text-xs mt-1">Livraison {mad(r.delivery_fee)} · min {mad(r.min_order)}</p>
    </Link>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="card text-center text-gray-500 py-10">{text}</div>;
}
export function Loading() {
  return <div className="text-center py-10 text-brand animate-pulse">Chargement…</div>;
}
export function ErrorBox({ msg }: { msg: string }) {
  return <div role="alert" className="bg-red-50 border border-red-300 text-red-700 rounded-lg p-3">{msg}</div>;
}
