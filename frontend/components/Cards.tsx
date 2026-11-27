import Link from "next/link";
import { mad } from "@/lib/api";

const TONES = [
  "from-[#F2EAF8] via-[#E4D3F2] to-[#D9C2EE]",
  "from-[#FFF1E2] via-[#FBE0C3] to-[#F7CFA3]",
  "from-[#F5ECD3] via-[#EBDDB0] to-[#E2CB8A]",
  "from-[#EDE7FB] via-[#DCD0F7] to-[#C8B6F0]",
  "from-[#FDE8EE] via-[#F9D3DE] to-[#F2B8C9]",
  "from-[#E6F1EE] via-[#CFE6DF] to-[#B5D6CB]",
];
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function Visual({ emoji, seed = "", className = "" }: { emoji: string; seed?: string; className?: string }) {
  const tone = TONES[hash(seed || emoji) % TONES.length];
  return (
    <div className={`group/v relative overflow-hidden rounded-xl bg-gradient-to-br ${tone} flex items-center justify-center ${className}`}>
      <span className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/40" />
      <span className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/30" />
      <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/5 to-transparent" />
      <span className="relative text-6xl md:text-7xl drop-shadow-[0_12px_14px_rgba(50,20,73,.25)] transition-transform duration-300 group-hover/v:scale-110 group-hover/v:-rotate-6" aria-hidden>{emoji}</span>
    </div>
  );
}

export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-gold text-sm tracking-tighter" aria-hidden>{"★".repeat(Math.round(value))}<span className="text-gray-300">{"★".repeat(5 - Math.round(value))}</span></span>
      <span className="text-gray-500">{value.toFixed(1)}{count !== undefined && ` (${count})`}</span>
    </span>
  );
}

export function ProductCard({ p }: { p: any }) {
  return (
    <Link href={`/products/${p.id}`} className="group card !p-3 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 block">
      <div className="relative">
        <Visual emoji={p.emoji} seed={p.category + p.title} className="h-44" />
        {p.discount_pct > 0 && <span className="absolute top-2 left-2 bg-accent text-white text-xs font-bold rounded-full px-2.5 py-1 shadow">-{p.discount_pct}%</span>}
        {p.stock < 6 && p.stock > 0 && <span className="absolute top-2 right-2 bg-white/90 text-red-600 text-[11px] font-semibold rounded-full px-2 py-0.5">Plus que {p.stock}</span>}
      </div>
      <div className="px-1 pt-3 space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-gold font-semibold">{p.brand}</p>
        <h3 className="font-semibold leading-snug line-clamp-2 min-h-[2.6rem] group-hover:text-brand">{p.title}</h3>
        <Stars value={p.rating_avg} count={p.rating_count} />
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-xl font-extrabold text-brand-dark">{mad(p.final_price)}</span>
          {p.discount_pct > 0 && <span className="text-xs line-through text-gray-400">{mad(p.price)}</span>}
        </div>
      </div>
    </Link>
  );
}

export function RestaurantCard({ r }: { r: any }) {
  return (
    <Link href={`/restaurants/${r.id}`} className="group card !p-3 hover:shadow-lift hover:-translate-y-1 transition-all duration-300 block">
      <div className="relative">
        <Visual emoji={r.emoji} seed={r.name} className="h-36" />
        <span className="absolute bottom-2 left-2 bg-white rounded-full px-2.5 py-1 text-xs font-bold shadow flex items-center gap-1">⏱ {r.prep_minutes + 15} min</span>
        <span className="absolute top-2 right-2 bg-brand-dark text-gold-champagne rounded-full px-2.5 py-1 text-xs font-bold shadow">★ {r.rating_avg.toFixed(1)}</span>
      </div>
      <div className="px-1 pt-3 space-y-1">
        <h3 className="font-bold text-lg group-hover:text-brand">{r.name}</h3>
        <p className="text-sm text-gray-500">{r.category} · {r.city}</p>
        <div className="flex gap-2 pt-1"><span className="chip">🛵 {mad(r.delivery_fee)}</span><span className="chip">Min {mad(r.min_order)}</span></div>
      </div>
    </Link>
  );
}

export function Empty({ text, icon = "🛒" }: { text: string; icon?: string }) {
  return <div className="card text-center py-14"><div className="text-5xl mb-3">{icon}</div><p className="text-gray-600">{text}</p></div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`relative overflow-hidden rounded-xl bg-brand/10 ${className}`}><div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" /></div>;
}
export function GridSkeleton({ n = 8, h = "h-72" }: { n?: number; h?: string }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{Array.from({ length: n }).map((_, i) => <Skeleton key={i} className={h} />)}</div>;
}
export function Loading() { return <GridSkeleton n={4} />; }
export function ErrorBox({ msg }: { msg: string }) {
  return <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex gap-2"><span>⚠️</span><span>{msg}</span></div>;
}
export function SectionHead({ title, href, label = "Voir tout →" }: { title: string; href?: string; label?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div><h2 className="section-title">{title}</h2><div className="mt-1 h-1 w-12 rounded bg-gold" /></div>
      {href && <Link href={href} className="text-sm font-semibold text-brand hover:text-accent">{label}</Link>}
    </div>
  );
}
