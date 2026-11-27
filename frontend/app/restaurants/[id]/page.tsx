"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, mad, getUser } from "@/lib/api";
import { toast, cartChanged } from "@/lib/ui";
import { useFetch } from "@/components/useFetch";
import { Visual, Stars, Skeleton, ErrorBox, SectionHead } from "@/components/Cards";

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: r, loading, error } = useFetch<any>(`/api/restaurants/${id}`);
  const [addons, setAddons] = useState<Record<string, string[]>>({});
  if (loading) return <Skeleton className="h-72" />;
  if (error || !r) return <ErrorBox msg={error || "Restaurant introuvable"} />;
  const toggle = (mid: string, name: string) => setAddons((a) => ({ ...a, [mid]: a[mid]?.includes(name) ? a[mid].filter((x) => x !== name) : [...(a[mid] || []), name] }));
  const add = async (mid: string) => {
    if (!getUser()) return router.push("/login");
    try { await api("/api/cart", { method: "POST", body: { kind: "meal", ref_id: r.id, meal_id: mid, qty: 1, addons: addons[mid] || [] } }); toast("🍽️ Plat ajouté au panier"); cartChanged(); }
    catch (e: any) { toast("⚠️ " + e.message); }
  };
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark to-brand text-white p-8 md:p-10 flex gap-6 items-center flex-wrap">
        <Visual emoji={r.emoji} seed={r.name} className="w-36 h-36 shrink-0 !rounded-3xl [&>span:last-child]:!text-7xl" />
        <div className="space-y-2">
          <span className="chip !bg-gold !text-brand-dark">{r.category}</span>
          <h1 className="font-display text-3xl md:text-4xl font-black">{r.name}</h1>
          <p className="text-purple-100 max-w-xl">{r.description}</p>
          <div className="flex gap-2 flex-wrap text-sm">
            <span className="bg-white/15 rounded-full px-3 py-1">★ {r.rating_avg.toFixed(1)} ({r.rating_count})</span>
            <span className="bg-white/15 rounded-full px-3 py-1">⏱ ~{r.prep_minutes + 15} min</span>
            <span className="bg-white/15 rounded-full px-3 py-1">🛵 {mad(r.delivery_fee)}</span>
            <span className="bg-white/15 rounded-full px-3 py-1">Min {mad(r.min_order)}</span>
            <span className="bg-white/15 rounded-full px-3 py-1">🕘 {r.open_hours}</span>
          </div>
        </div>
      </div>
      <section>
        <SectionHead title="Menu" />
        <div className="grid md:grid-cols-2 gap-5">
          {r.menu.map((m: any) => (
            <div key={m.id} className="card !p-4 flex gap-4">
              <Visual emoji={m.emoji} seed={m.name} className="w-28 h-28 shrink-0 [&>span:last-child]:!text-5xl" />
              <div className="flex-1 space-y-1">
                <div className="flex justify-between gap-2"><h3 className="font-bold text-lg">{m.name}</h3><span className="font-extrabold text-brand-dark whitespace-nowrap">{mad(m.price)}</span></div>
                <p className="text-sm text-gray-500">{m.description}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 py-1">
                  {m.addons.map((a: any) => (
                    <label key={a.name} className="text-xs flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" className="accent-[#54247A]" checked={addons[m.id]?.includes(a.name) || false} onChange={() => toggle(m.id, a.name)} />{a.name} <b>+{a.price}</b>
                    </label>
                  ))}
                </div>
                <button className="btn-accent !py-1.5 !px-4 text-sm" onClick={() => add(m.id)}>+ Ajouter</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <SectionHead title="Avis" />
        {r.reviews.length === 0 ? <p className="text-gray-500">Aucun avis pour le moment.</p> : (
          <div className="grid md:grid-cols-2 gap-4">{r.reviews.map((v: any, i: number) => <div key={i} className="card !p-4"><p className="font-semibold">{v.user_name}</p><Stars value={v.rating} /><p className="text-sm mt-1">{v.comment}</p></div>)}</div>
        )}
      </section>
    </div>
  );
}
