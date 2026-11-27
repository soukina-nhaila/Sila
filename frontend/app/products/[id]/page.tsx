"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, mad, getUser } from "@/lib/api";
import { toast, cartChanged } from "@/lib/ui";
import { useFetch } from "@/components/useFetch";
import { Visual, ProductCard, Stars, Skeleton, ErrorBox, SectionHead } from "@/components/Cards";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: p, loading, error, reload } = useFetch<any>(`/api/products/${id}`);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const act = async (fn: () => Promise<any>, ok: string) => {
    if (!getUser()) return router.push("/login");
    try { await fn(); toast(ok); cartChanged(); reload(); } catch (e: any) { toast("⚠️ " + e.message); }
  };
  if (loading) return <div className="grid md:grid-cols-2 gap-8"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;
  if (error || !p) return <ErrorBox msg={error || "Produit introuvable"} />;
  return (
    <div className="space-y-12">
      <nav className="text-sm text-gray-500"><Link href="/" className="hover:text-brand">Accueil</Link> / <Link href="/products" className="hover:text-brand">Boutique</Link> / <span className="text-ink">{p.title}</span></nav>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-3">
          <Visual emoji={p.emoji} seed={p.category + p.title} className="h-[26rem] !rounded-3xl [&>span:last-child]:!text-[9rem]" />
          <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <Visual key={i} emoji={p.emoji} seed={p.title + i} className="h-20 !rounded-2xl [&>span:last-child]:!text-4xl" />)}</div>
        </div>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-gold font-bold">{p.brand}</p>
          <h1 className="font-display text-3xl md:text-4xl font-black text-brand-dark">{p.title}</h1>
          <Stars value={p.rating_avg} count={p.rating_count} />
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-brand-dark">{mad(p.final_price)}</span>
            {p.discount_pct > 0 && <><span className="line-through text-gray-400">{mad(p.price)}</span><span className="bg-accent text-white text-sm font-bold rounded-full px-3 py-1">-{p.discount_pct}%</span></>}
          </div>
          <p className="text-gray-700 leading-relaxed">{p.description}</p>
          <p>{p.stock > 0 ? <span className="chip !bg-green-100 !text-green-700">✔ En stock ({p.stock})</span> : <span className="chip !bg-red-100 !text-red-700">Rupture de stock</span>}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center border border-brand/20 rounded-xl bg-white">
              <button className="px-4 py-2 text-xl" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Moins">−</button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button className="px-4 py-2 text-xl" onClick={() => setQty(Math.min(Math.max(1, p.stock), qty + 1))} aria-label="Plus">+</button>
            </div>
            <button className="btn-accent flex-1 min-w-[180px] !py-3.5 text-lg" disabled={p.stock < 1} onClick={() => act(() => api("/api/cart", { method: "POST", body: { kind: "product", ref_id: p.id, qty } }), "🛒 Ajouté au panier")}>Ajouter au panier</button>
            <button className="btn-ghost !py-3.5" aria-label="Favori" onClick={() => act(() => api(`/api/wishlist/${p.id}`, { method: "POST" }), "♥ Liste de souhaits mise à jour")}>♥</button>
          </div>
          <div className="card !p-4 space-y-2 text-sm">
            <p>🏪 Vendu par <b>{p.seller?.store_name}</b></p>
            <p>🚚 Livraison nationale : <b>2-4 jours</b> (gratuite dès 500 MAD)</p>
            <p>🌍 Livraison internationale : <b>7-15 jours</b></p>
            <p>🛡️ Paiement à la livraison ou carte (simulée)</p>
          </div>
        </div>
      </div>
      <section>
        <SectionHead title={`Avis clients (${p.reviews.length})`} />
        <div className="grid md:grid-cols-2 gap-4">
          {p.reviews.length === 0 && <p className="text-gray-500">Soyez le premier à donner votre avis.</p>}
          {p.reviews.map((r: any, i: number) => (
            <div key={i} className="card !p-4 flex gap-3">
              <span className="w-10 h-10 shrink-0 rounded-full bg-brand text-white flex items-center justify-center font-bold">{String(r.user_name)[0]}</span>
              <div><p className="font-semibold">{r.user_name}</p><Stars value={r.rating} /><p className="text-sm text-gray-700 mt-1">{r.comment}</p></div>
            </div>
          ))}
        </div>
        <div className="card mt-4 flex gap-3 flex-wrap items-center">
          <select className="input !w-28" value={rating} onChange={(e) => setRating(+e.target.value)}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
          <input className="input flex-1 min-w-[200px]" placeholder="Partagez votre expérience…" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn-primary" onClick={() => act(() => api(`/api/products/${p.id}/reviews`, { method: "POST", body: { rating, comment } }).then(() => setComment("")), "Merci pour votre avis ⭐")}>Publier</button>
        </div>
      </section>
      <section><SectionHead title="Produits similaires" /><div className="grid grid-cols-2 md:grid-cols-4 gap-5">{p.related.map((r: any) => <ProductCard key={r.id} p={r} />)}</div></section>
    </div>
  );
}
