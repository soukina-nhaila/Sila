"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, mad, getUser } from "@/lib/api";
import { useFetch } from "@/components/useFetch";
import { Visual, ProductCard, Loading, ErrorBox } from "@/components/Cards";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: p, loading, error, reload } = useFetch<any>(`/api/products/${id}`);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const act = async (fn: () => Promise<any>, ok: string) => {
    if (!getUser()) return router.push("/login");
    try { await fn(); setMsg(ok); reload(); } catch (e: any) { setMsg("⚠️ " + e.message); }
  };
  if (loading) return <Loading />;
  if (error || !p) return <ErrorBox msg={error || "Introuvable"} />;
  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Visual emoji={p.emoji} className="h-72" />
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">{p.title}</h1>
          <p className="text-sm text-gray-500">{p.brand} · ⭐ {p.rating_avg} ({p.rating_count} avis) · Vendu par <b>{p.seller?.store_name}</b></p>
          <p className="text-3xl font-black text-brand">{mad(p.final_price)} {p.discount_pct > 0 && <span className="text-base line-through text-gray-400">{mad(p.price)}</span>}</p>
          <p>{p.description}</p>
          <p className={p.stock > 0 ? "text-green-700" : "text-red-600"}>{p.stock > 0 ? `En stock (${p.stock})` : "Rupture de stock"}</p>
          <div className="flex gap-2 items-center">
            <input type="number" min={1} max={50} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} className="input w-20" aria-label="Quantité" />
            <button className="btn-accent" disabled={p.stock < 1} onClick={() => act(() => api("/api/cart", { method: "POST", body: { kind: "product", ref_id: p.id, qty } }), "Ajouté au panier ✔")}>Ajouter au panier</button>
            <button className="btn-ghost" onClick={() => act(() => api(`/api/wishlist/${p.id}`, { method: "POST" }), "Liste de souhaits mise à jour ♥")}>♥</button>
          </div>
          {msg && <p className="text-sm">{msg}</p>}
        </div>
      </div>
      <section className="card">
        <h2 className="font-bold mb-2">Avis</h2>
        {p.reviews.length === 0 && <p className="text-gray-500 text-sm">Aucun avis pour le moment.</p>}
        {p.reviews.map((r: any, i: number) => <p key={i} className="text-sm border-b py-1">⭐{r.rating} <b>{r.user_name}</b> : {r.comment}</p>)}
        <div className="flex gap-2 mt-3 flex-wrap">
          <select className="input w-24" value={rating} onChange={(e) => setRating(+e.target.value)}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select>
          <input className="input flex-1" placeholder="Votre commentaire" maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn-primary" onClick={() => act(() => api(`/api/products/${p.id}/reviews`, { method: "POST", body: { rating, comment } }), "Merci pour votre avis")}>Publier</button>
        </div>
      </section>
      <section><h2 className="font-bold mb-2">Produits similaires</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{p.related.map((r: any) => <ProductCard key={r.id} p={r} />)}</div></section>
    </div>
  );
}
