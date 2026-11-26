"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, mad, getUser } from "@/lib/api";
import { useFetch } from "@/components/useFetch";
import { Visual, Loading, ErrorBox } from "@/components/Cards";

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: r, loading, error } = useFetch<any>(`/api/restaurants/${id}`);
  const [addons, setAddons] = useState<Record<string, string[]>>({});
  const [msg, setMsg] = useState("");
  if (loading) return <Loading />;
  if (error || !r) return <ErrorBox msg={error || "Introuvable"} />;
  const toggle = (mid: string, name: string) => setAddons((a) => ({ ...a, [mid]: a[mid]?.includes(name) ? a[mid].filter((x) => x !== name) : [...(a[mid] || []), name] }));
  const add = async (mid: string) => {
    if (!getUser()) return router.push("/login");
    try { await api("/api/cart", { method: "POST", body: { kind: "meal", ref_id: r.id, meal_id: mid, qty: 1, addons: addons[mid] || [] } }); setMsg("Plat ajouté au panier repas ✔"); }
    catch (e: any) { setMsg("⚠️ " + e.message); }
  };
  return (
    <div className="space-y-6">
      <div className="card flex gap-4 items-center">
        <Visual emoji={r.emoji} className="w-28 h-28 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold">{r.name}</h1>
          <p className="text-sm text-gray-600">{r.category} · ⭐ {r.rating_avg} ({r.rating_count}) · Ouvert {r.open_hours}</p>
          <p className="text-sm">{r.description}</p>
          <p className="text-sm mt-1">Livraison {mad(r.delivery_fee)} · Minimum {mad(r.min_order)} · Préparation ~{r.prep_minutes} min</p>
        </div>
      </div>
      {msg && <p>{msg}</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {r.menu.map((m: any) => (
          <div key={m.id} className="card flex gap-3">
            <Visual emoji={m.emoji} className="w-20 h-20 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold">{m.name} <span className="text-brand">{mad(m.price)}</span></h3>
              <p className="text-xs text-gray-500">{m.description}</p>
              <div className="flex flex-wrap gap-2 my-1">
                {m.addons.map((a: any) => (
                  <label key={a.name} className="text-xs flex items-center gap-1">
                    <input type="checkbox" checked={addons[m.id]?.includes(a.name) || false} onChange={() => toggle(m.id, a.name)} />{a.name} (+{a.price})
                  </label>
                ))}
              </div>
              <button className="btn-accent text-sm" onClick={() => add(m.id)}>Ajouter</button>
            </div>
          </div>
        ))}
      </div>
      <section className="card"><h2 className="font-bold mb-2">Avis</h2>
        {r.reviews.length === 0 ? <p className="text-sm text-gray-500">Aucun avis.</p> : r.reviews.map((v: any, i: number) => <p key={i} className="text-sm">⭐{v.rating} <b>{v.user_name}</b> : {v.comment}</p>)}
      </section>
    </div>
  );
}
