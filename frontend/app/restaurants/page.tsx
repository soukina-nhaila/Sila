"use client";
import { useState } from "react";
import { useFetch } from "@/components/useFetch";
import { RestaurantCard, GridSkeleton, ErrorBox, Empty } from "@/components/Cards";

const ICONS: Record<string, string> = { Pizza: "🍕", Burgers: "🍔", Tacos: "🌮", Sandwiches: "🥪", Traditionnel: "🍲", Desserts: "🍨", Boulangerie: "🥐", "Café": "☕", "Fast food": "🍗", Snack: "🍟" };

export default function Restaurants() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const cats = useFetch<string[]>("/api/restaurant-categories");
  const qs = new URLSearchParams({ per_page: "24" });
  if (q) qs.set("q", q);
  if (cat) qs.set("category", cat);
  const { data, loading, error } = useFetch<any>(`/api/restaurants?${qs}`);
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-accent to-[#F7A96B] text-white p-8 md:p-10">
        <h1 className="font-display text-3xl md:text-4xl font-black">Faim ? On livre.</h1>
        <p className="mt-1 opacity-95">Restaurants, snacks, cafés et boulangeries de votre ville.</p>
        <input className="mt-5 w-full max-w-md rounded-full px-5 py-3 text-ink focus:outline-none shadow-lift" placeholder="Rechercher un restaurant…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button className={`btn whitespace-nowrap ${cat === "" ? "bg-brand text-white" : "bg-white border border-brand/20 text-brand"}`} onClick={() => setCat("")}>Tous</button>
        {cats.data?.map((c) => <button key={c} className={`btn whitespace-nowrap ${cat === c ? "bg-brand text-white" : "bg-white border border-brand/20 text-brand"}`} onClick={() => setCat(c)}>{ICONS[c]} {c}</button>)}
      </div>
      {loading ? <GridSkeleton h="h-64" /> : error ? <ErrorBox msg={error} /> : data.items.length === 0 ? <Empty icon="🍽️" text="Aucun restaurant trouvé." /> :
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{data.items.map((r: any) => <RestaurantCard key={r.id} r={r} />)}</div>}
    </div>
  );
}
